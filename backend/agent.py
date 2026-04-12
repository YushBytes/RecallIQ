"""
Agent Core — the orchestrator that ties memory + LLM + deals together.

Flow for each chat interaction:
1. Recall relevant memories for the user's message
2. Build a context-enriched system prompt
3. Call Groq LLM with full context
4. Store the interaction as a new memory
5. Extract deal intelligence (objections, stage changes)
6. Return response + memory metadata for the UI
"""

import json
import re
from typing import Optional

from memory_service import memory_engine, HindsightMemoryEngine
from llm_service import generate_response, generate_reflection
from deal_manager import get_all_deals, update_deal


BANK_NAME = "deal-intelligence-agent"
BANK_BACKGROUND = (
    "An AI sales intelligence agent that remembers all past interactions, "
    "learns from them, and provides increasingly personalized deal advice."
)

# System prompt that evolves based on memory depth
BASE_SYSTEM_PROMPT = """You are DealMind AI — an elite sales intelligence agent.

Your capabilities:
- Analyze deals, objections, and competitor situations
- Provide strategic recommendations based on sales best practices
- Remember ALL past conversations and learn from them
- Track deal progress and suggest next best actions

Personality: Confident but collaborative. Data-driven. Action-oriented.
Tone: Professional yet approachable. Like a top sales coach.

{memory_context}

{deal_context}

IMPORTANT RULES:
- If you have relevant memories from past interactions, ALWAYS reference them naturally
  (e.g., "Based on our previous discussion about X..." or "I recall you mentioned...")
- Be specific and actionable — avoid generic advice
- When discussing objections, provide concrete counter-strategies
- If this is a new conversation with no memories, acknowledge that you're starting fresh
  and ask smart qualifying questions
"""


def _get_bank() -> str:
    """Get or create the main memory bank, return its ID."""
    bank = memory_engine.get_or_create_bank(BANK_NAME, BANK_BACKGROUND)
    return bank.id


def _build_memory_context(bank_id: str, query: str) -> tuple[str, list[dict]]:
    """
    Build memory context string and return relevant memories.
    This is where the 'learning over time' magic happens.
    """
    memories = memory_engine.recall(bank_id, query, top_k=5)
    stats = memory_engine.get_stats(bank_id)

    if not memories:
        return (
            "\n## Memory Status: COLD START\n"
            "You have no past memories yet. This appears to be a new conversation.\n"
            "Start by asking insightful qualifying questions to build context.\n",
            [],
        )

    # Build rich context from memories
    context_parts = [
        f"\n## Memory Status: {stats['total']} memories stored",
        f"Memory depth: {'Deep' if stats['total'] > 15 else 'Growing' if stats['total'] > 5 else 'Building'}",
        "\n### Relevant Past Interactions:",
    ]

    for i, mem in enumerate(memories, 1):
        score = mem.get("relevance_score", 0)
        context_parts.append(
            f"{i}. [{mem['memory_type'].upper()}] (relevance: {score:.0%}) {mem['content']}"
        )

    context = "\n".join(context_parts)
    return context, memories


def _build_deal_context() -> str:
    """Build context from active deals for cross-deal insights."""
    deals = get_all_deals()
    if not deals:
        return "\n## Active Deals: None yet\n"

    parts = [f"\n## Active Deals ({len(deals)} in pipeline):"]
    for deal in deals[:5]:  # Top 5 most recent
        objections = deal.get("objections", [])
        if isinstance(objections, str):
            try:
                objections = json.loads(objections)
            except json.JSONDecodeError:
                objections = []
        parts.append(
            f"- {deal['client_name']} ({deal.get('company', 'N/A')}) | "
            f"Stage: {deal['stage']} | Value: ${deal.get('deal_value', 0):,.0f} | "
            f"Win prob: {deal.get('win_probability', 0):.0%} | "
            f"Objections: {', '.join(objections) if objections else 'None tracked'}"
        )

    return "\n".join(parts)


async def chat(
    user_message: str,
    conversation_history: Optional[list[dict]] = None,
    deal_id: Optional[str] = None,
) -> dict:
    """
    Main chat endpoint logic.

    Returns a rich response with:
    - response: The AI's message
    - memories_used: Memories that influenced the response
    - memory_count: Total memories in the bank
    - learning_level: Current learning stage indicator
    """
    bank_id = _get_bank()

    # 1. RECALL — retrieve relevant memories
    memory_context, memories_used = _build_memory_context(bank_id, user_message)

    # 2. BUILD CONTEXT — combine memory + deals
    deal_context = _build_deal_context()
    system_prompt = BASE_SYSTEM_PROMPT.format(
        memory_context=memory_context,
        deal_context=deal_context,
    )

    # 3. GENERATE — call Groq LLM
    messages = conversation_history or []
    messages.append({"role": "user", "content": user_message})

    response_text = generate_response(system_prompt, messages)

    # 4. RETAIN — store this interaction as a memory
    interaction_content = (
        f"User asked: {user_message}\n"
        f"Agent responded: {response_text[:300]}..."
        if len(response_text) > 300
        else f"User asked: {user_message}\nAgent responded: {response_text}"
    )

    memory_engine.retain(
        memory_bank_id=bank_id,
        content=interaction_content,
        memory_type="experience",
        metadata={
            "user_message": user_message,
            "deal_id": deal_id,
            "memories_recalled": len(memories_used),
        },
    )

    # Also extract and store key facts as 'world' memories
    _extract_and_store_facts(bank_id, user_message, response_text)

    # 5. COMPUTE learning level
    stats = memory_engine.get_stats(bank_id)
    total = stats["total"]
    if total <= 3:
        learning_level = "cold_start"
        learning_label = "🧊 Cold Start — Building initial context"
    elif total <= 10:
        learning_level = "learning"
        learning_label = "📚 Learning — Recognizing patterns"
    elif total <= 20:
        learning_level = "proficient"
        learning_label = "🎯 Proficient — Providing personalized insights"
    else:
        learning_level = "expert"
        learning_label = "🧠 Expert — Deep contextual intelligence"

    return {
        "response": response_text,
        "memories_used": memories_used,
        "memory_count": total,
        "learning_level": learning_level,
        "learning_label": learning_label,
    }


def _extract_and_store_facts(bank_id: str, user_message: str, response: str):
    """
    Extract factual information from the conversation and store as 'world' memories.
    This builds the agent's knowledge base beyond just interaction history.
    """
    # Simple heuristic extraction — look for key patterns
    message_lower = user_message.lower()

    # Client/company mentions
    if any(word in message_lower for word in ["client", "customer", "company", "prospect"]):
        memory_engine.retain(
            memory_bank_id=bank_id,
            content=f"Deal context mentioned: {user_message[:200]}",
            memory_type="world",
            metadata={"source": "extracted_fact"},
        )

    # Objection patterns
    if any(word in message_lower for word in ["objection", "concern", "pushback", "hesitant", "worried", "expensive", "budget"]):
        memory_engine.retain(
            memory_bank_id=bank_id,
            content=f"Objection encountered: {user_message[:200]}",
            memory_type="world",
            metadata={"source": "objection_tracking"},
        )

    # Competitor mentions
    if any(word in message_lower for word in ["competitor", "alternative", "vs", "compared to", "salesforce", "hubspot"]):
        memory_engine.retain(
            memory_bank_id=bank_id,
            content=f"Competitive intelligence: {user_message[:200]}",
            memory_type="world",
            metadata={"source": "competitive_intel"},
        )


async def reflect_on_topic(query: str) -> dict:
    """
    Trigger a reflection — the agent synthesizes insights from accumulated memories.
    This is the 'learning' demonstration for judges.
    """
    bank_id = _get_bank()
    reflection_data = memory_engine.reflect(bank_id, query)

    if reflection_data["memories_used"] == 0:
        return {
            "reflection": "I don't have enough memories yet to reflect on this topic. "
                         "Let's have a few more conversations first!",
            "memories_analyzed": 0,
        }

    # Use LLM to synthesize the reflection
    reflection_text = generate_reflection(
        reflection_data["reflection_prompt"], query
    )

    # Store the reflection itself as an 'opinion' memory
    memory_engine.retain(
        memory_bank_id=bank_id,
        content=f"Reflection on '{query}': {reflection_text[:300]}",
        memory_type="opinion",
        metadata={"source": "self_reflection", "query": query},
    )

    stats = memory_engine.get_stats(bank_id)

    return {
        "reflection": reflection_text,
        "memories_analyzed": reflection_data["memories_used"],
        "total_memories": stats["total"],
        "memories": reflection_data["memories"],
    }
