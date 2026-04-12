"""
Hindsight-style Memory Service — the CORE of the system.

Implements retain / recall / reflect pattern:
- retain():  Store an interaction with metadata
- recall():  Retrieve relevant past interactions via TF-IDF similarity
- reflect(): Synthesize insights across memories using LLM

Persists to JSON on disk. Designed as a drop-in replacement that mirrors
the real hindsight-api MemoryEngine interface.
"""

import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from config import settings


class Memory:
    """Single memory unit — one interaction or fact."""

    def __init__(
        self,
        content: str,
        memory_type: str = "experience",  # experience | world | opinion
        metadata: Optional[dict] = None,
        memory_id: Optional[str] = None,
        timestamp: Optional[float] = None,
    ):
        self.id = memory_id or str(uuid.uuid4())
        self.content = content
        self.memory_type = memory_type
        self.metadata = metadata or {}
        self.timestamp = timestamp or time.time()
        self.created_at = datetime.fromtimestamp(self.timestamp).isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "content": self.content,
            "memory_type": self.memory_type,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "created_at": self.created_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Memory":
        return cls(
            content=data["content"],
            memory_type=data.get("memory_type", "experience"),
            metadata=data.get("metadata", {}),
            memory_id=data.get("id"),
            timestamp=data.get("timestamp"),
        )


class MemoryBank:
    """A collection of memories for a specific agent/context."""

    def __init__(self, name: str, bank_id: Optional[str] = None, background: str = ""):
        self.id = bank_id or str(uuid.uuid4())
        self.name = name
        self.background = background
        self.memories: list[Memory] = []
        self._vectorizer: Optional[TfidfVectorizer] = None
        self._tfidf_matrix = None
        self._dirty = True  # Track when re-vectorization is needed

    def _rebuild_index(self):
        """Rebuild TF-IDF index when memories change."""
        if not self.memories:
            self._vectorizer = None
            self._tfidf_matrix = None
            return

        corpus = [m.content for m in self.memories]
        self._vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000,
            ngram_range=(1, 2),
        )
        self._tfidf_matrix = self._vectorizer.fit_transform(corpus)
        self._dirty = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "background": self.background,
            "memories": [m.to_dict() for m in self.memories],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MemoryBank":
        bank = cls(name=data["name"], bank_id=data["id"], background=data.get("background", ""))
        bank.memories = [Memory.from_dict(m) for m in data.get("memories", [])]
        bank._dirty = True
        return bank


class HindsightMemoryEngine:
    """
    Lightweight in-process memory engine mirroring the hindsight-api interface.

    Core operations:
    - retain(content)  → stores a memory
    - recall(query, k) → retrieves k most relevant memories
    - reflect(query)   → returns reflection prompt for LLM synthesis
    """

    def __init__(self, persist_path: Optional[str] = None):
        self.persist_path = persist_path or settings.MEMORY_PERSIST_PATH
        self.banks: dict[str, MemoryBank] = {}
        self._load()

    # ─── Public API (mirrors hindsight-api) ───

    def create_memory_bank(self, name: str, background: str = "") -> MemoryBank:
        """Create a new memory bank for an agent context."""
        bank = MemoryBank(name=name, background=background)
        self.banks[bank.id] = bank
        self._save()
        return bank

    def get_or_create_bank(self, name: str, background: str = "") -> MemoryBank:
        """Get existing bank by name or create new one."""
        for bank in self.banks.values():
            if bank.name == name:
                return bank
        return self.create_memory_bank(name=name, background=background)

    def retain(
        self,
        memory_bank_id: str,
        content: str,
        memory_type: str = "experience",
        metadata: Optional[dict] = None,
    ) -> Memory:
        """Store a new memory in the bank."""
        bank = self.banks.get(memory_bank_id)
        if not bank:
            raise ValueError(f"Memory bank {memory_bank_id} not found")

        memory = Memory(content=content, memory_type=memory_type, metadata=metadata)
        bank.memories.append(memory)
        bank._dirty = True
        self._save()
        return memory

    def recall(
        self,
        memory_bank_id: str,
        query: str,
        top_k: int = 5,
        memory_type: Optional[str] = None,
    ) -> list[dict]:
        """
        Retrieve the most relevant memories for a query.
        Uses TF-IDF cosine similarity (fast, no external embeddings needed).
        """
        bank = self.banks.get(memory_bank_id)
        if not bank or not bank.memories:
            return []

        # Filter by type if specified
        memories = bank.memories
        if memory_type:
            memories = [m for m in memories if m.memory_type == memory_type]
        if not memories:
            return []

        # Build index if needed
        if bank._dirty:
            bank._rebuild_index()

        if bank._vectorizer is None or bank._tfidf_matrix is None:
            return []

        # Compute similarity
        query_vec = bank._vectorizer.transform([query])

        # If we filtered by type, we need to get the right indices
        if memory_type:
            all_indices = [i for i, m in enumerate(bank.memories) if m.memory_type == memory_type]
            sub_matrix = bank._tfidf_matrix[all_indices]
            similarities = cosine_similarity(query_vec, sub_matrix).flatten()
            top_indices = np.argsort(similarities)[::-1][:top_k]
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.01:  # minimum relevance threshold
                    mem = memories[idx]
                    results.append({
                        **mem.to_dict(),
                        "relevance_score": round(float(similarities[idx]), 4),
                    })
        else:
            similarities = cosine_similarity(query_vec, bank._tfidf_matrix).flatten()
            top_indices = np.argsort(similarities)[::-1][:top_k]
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.01:
                    mem = bank.memories[idx]
                    results.append({
                        **mem.to_dict(),
                        "relevance_score": round(float(similarities[idx]), 4),
                    })

        return results

    def reflect(self, memory_bank_id: str, query: str) -> dict:
        """
        Gather context for LLM reflection — returns relevant memories
        plus a reflection prompt. The actual LLM call happens in agent.py.
        """
        # Pull broad context for reflection
        relevant = self.recall(memory_bank_id, query, top_k=10)

        # Separate by type
        experiences = [m for m in relevant if m.get("memory_type") == "experience"]
        world_facts = [m for m in relevant if m.get("memory_type") == "world"]
        opinions = [m for m in relevant if m.get("memory_type") == "opinion"]

        reflection_prompt = (
            f"Based on these past experiences and knowledge, reflect on: {query}\n\n"
            f"## Past Experiences ({len(experiences)} relevant):\n"
            + "\n".join(f"- {e['content']}" for e in experiences[:5])
            + f"\n\n## Known Facts ({len(world_facts)} relevant):\n"
            + "\n".join(f"- {f['content']}" for f in world_facts[:5])
            + f"\n\n## Current Beliefs ({len(opinions)} relevant):\n"
            + "\n".join(f"- {o['content']}" for o in opinions[:3])
            + "\n\nSynthesize actionable insights from these memories."
        )

        return {
            "reflection_prompt": reflection_prompt,
            "memories_used": len(relevant),
            "memories": relevant,
        }

    def get_stats(self, memory_bank_id: str) -> dict:
        """Get statistics about a memory bank."""
        bank = self.banks.get(memory_bank_id)
        if not bank:
            return {"total": 0, "by_type": {}}

        by_type: dict[str, int] = {}
        for m in bank.memories:
            by_type[m.memory_type] = by_type.get(m.memory_type, 0) + 1

        return {
            "total": len(bank.memories),
            "by_type": by_type,
            "oldest": bank.memories[0].created_at if bank.memories else None,
            "newest": bank.memories[-1].created_at if bank.memories else None,
        }

    def get_all_memories(self, memory_bank_id: str) -> list[dict]:
        """Return all memories in a bank (for the memory panel UI)."""
        bank = self.banks.get(memory_bank_id)
        if not bank:
            return []
        return [m.to_dict() for m in sorted(bank.memories, key=lambda m: m.timestamp, reverse=True)]

    # ─── Persistence ───

    def _save(self):
        """Persist all banks to JSON."""
        path = Path(self.persist_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        data = {bid: bank.to_dict() for bid, bank in self.banks.items()}
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def _load(self):
        """Load banks from JSON if exists."""
        path = Path(self.persist_path)
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                self.banks = {bid: MemoryBank.from_dict(bdata) for bid, bdata in data.items()}
            except (json.JSONDecodeError, KeyError):
                self.banks = {}


# Singleton instance
memory_engine = HindsightMemoryEngine()
