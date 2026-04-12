"""
FastAPI Main Server — entry point for the AI Deal Intelligence Agent.

Endpoints:
  POST /api/chat           — Chat with the agent (memory-augmented)
  POST /api/reflect        — Trigger agent reflection on a topic
  GET  /api/memory         — Get all stored memories
  GET  /api/memory/stats   — Get memory statistics
  GET  /api/deals          — Get all deals
  POST /api/deals          — Create a new deal
  PUT  /api/deals/{id}     — Update a deal
  GET  /api/deals/stats    — Pipeline analytics
  POST /api/seed           — Re-seed sample data
  POST /api/reset          — Reset all data (for demo restarts)
  GET  /               — Serves the frontend UI
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import shutil
from pathlib import Path

from config import settings
from seed_data import seed_data
from memory_service import memory_engine
from deal_manager import (
    init_db, get_all_deals, get_deal, create_deal,
    update_deal, get_pipeline_stats, get_deal_interactions,
)
import agent


# ─── Lifespan (startup/shutdown) ───

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and seed data on startup."""
    print("[*] Starting AI Deal Intelligence Agent...")
    init_db()
    seed_data()
    print("[OK] Server ready!")
    yield
    print("[*] Shutting down...")


# ─── App ───

app = FastAPI(
    title="AI Deal Intelligence Agent",
    description="Memory-augmented sales intelligence powered by Hindsight + Groq",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@app.get("/")
async def serve_frontend():
    """Serve the frontend UI."""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")



# ─── Request/Response Models ───

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[dict]] = None
    deal_id: Optional[str] = None


class ReflectRequest(BaseModel):
    query: str


class DealCreateRequest(BaseModel):
    client_name: str
    company: str = ""
    deal_value: float = 0
    stage: str = "prospecting"
    notes: str = ""


class DealUpdateRequest(BaseModel):
    client_name: Optional[str] = None
    company: Optional[str] = None
    deal_value: Optional[float] = None
    stage: Optional[str] = None
    win_probability: Optional[float] = None
    objections: Optional[list[str]] = None
    notes: Optional[str] = None
    ai_recommendation: Optional[str] = None


# ─── Chat Endpoints ───

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Chat with the AI agent. Memory-augmented responses."""
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    try:
        result = await agent.chat(
            user_message=req.message,
            conversation_history=req.conversation_history,
            deal_id=req.deal_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Agent error: {str(e)}")


@app.post("/api/reflect")
async def reflect_endpoint(req: ReflectRequest):
    """Trigger agent reflection — synthesize insights from memories."""
    if not req.query.strip():
        raise HTTPException(400, "Query cannot be empty")

    try:
        result = await agent.reflect_on_topic(req.query)
        return result
    except Exception as e:
        raise HTTPException(500, f"Reflection error: {str(e)}")


# ─── Memory Endpoints ───

@app.get("/api/memory")
async def get_memories():
    """Get all stored memories for the UI panel."""
    bank = memory_engine.get_or_create_bank(agent.BANK_NAME)
    return {
        "memories": memory_engine.get_all_memories(bank.id),
        "stats": memory_engine.get_stats(bank.id),
    }


@app.get("/api/memory/stats")
async def get_memory_stats():
    """Get memory statistics."""
    bank = memory_engine.get_or_create_bank(agent.BANK_NAME)
    return memory_engine.get_stats(bank.id)


@app.post("/api/memory/store")
async def store_memory(content: str, memory_type: str = "world"):
    """Manually store a memory (for testing/demo)."""
    bank = memory_engine.get_or_create_bank(agent.BANK_NAME)
    mem = memory_engine.retain(bank.id, content, memory_type)
    return mem.to_dict()


@app.post("/api/memory/retrieve")
async def retrieve_memories(query: str, top_k: int = 5):
    """Retrieve relevant memories for a query (for testing/demo)."""
    bank = memory_engine.get_or_create_bank(agent.BANK_NAME)
    results = memory_engine.recall(bank.id, query, top_k)
    return {"query": query, "results": results, "count": len(results)}


# ─── Deal Endpoints ───

@app.get("/api/deals")
async def list_deals():
    """Get all deals for the dashboard."""
    return {"deals": get_all_deals()}


@app.post("/api/deals")
async def create_deal_endpoint(req: DealCreateRequest):
    """Create a new deal."""
    deal = create_deal(
        client_name=req.client_name,
        company=req.company,
        deal_value=req.deal_value,
        stage=req.stage,
        notes=req.notes,
    )
    return deal


@app.get("/api/deals/stats")
async def deal_stats():
    """Get pipeline analytics."""
    return get_pipeline_stats()


@app.get("/api/deals/{deal_id}")
async def get_deal_endpoint(deal_id: str):
    """Get a single deal."""
    deal = get_deal(deal_id)
    if not deal:
        raise HTTPException(404, "Deal not found")
    return deal


@app.put("/api/deals/{deal_id}")
async def update_deal_endpoint(deal_id: str, req: DealUpdateRequest):
    """Update a deal."""
    updates = req.model_dump(exclude_none=True)
    deal = update_deal(deal_id, **updates)
    if not deal:
        raise HTTPException(404, "Deal not found")
    return deal


# ─── Utility Endpoints ───

@app.post("/api/seed")
async def reseed():
    """Re-seed sample data (idempotent)."""
    seed_data()
    return {"status": "seeded"}


@app.post("/api/reset")
async def reset_data():
    """Reset all data — useful for demo restarts."""
    # Clear memory
    memory_engine.banks.clear()
    memory_engine._save()

    # Clear database
    db_path = Path(settings.DB_PATH)
    if db_path.exists():
        db_path.unlink()

    # Re-initialize
    init_db()
    seed_data()

    return {"status": "reset", "message": "All data reset and re-seeded"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "AI Deal Intelligence Agent"}


# ─── Run ───

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
