"""
Deal Manager — SQLite-backed deal tracking.

Manages the sales pipeline: deals, stages, objections, and interaction history.
Provides CRUD operations and deal analytics for the dashboard.
"""

import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from config import settings


def _get_db() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    path = Path(settings.DB_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema."""
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS deals (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            company TEXT,
            deal_value REAL DEFAULT 0,
            stage TEXT DEFAULT 'prospecting',
            win_probability REAL DEFAULT 0.1,
            objections TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            ai_recommendation TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS deal_interactions (
            id TEXT PRIMARY KEY,
            deal_id TEXT,
            user_message TEXT,
            ai_response TEXT,
            memories_used INTEGER DEFAULT 0,
            timestamp TEXT,
            FOREIGN KEY (deal_id) REFERENCES deals(id)
        );
    """)
    conn.commit()
    conn.close()


def create_deal(
    client_name: str,
    company: str = "",
    deal_value: float = 0,
    stage: str = "prospecting",
    notes: str = "",
) -> dict:
    """Create a new deal."""
    conn = _get_db()
    deal_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    conn.execute(
        """INSERT INTO deals (id, client_name, company, deal_value, stage, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (deal_id, client_name, company, deal_value, stage, notes, now, now),
    )
    conn.commit()
    deal = dict(conn.execute("SELECT * FROM deals WHERE id = ?", (deal_id,)).fetchone())
    conn.close()
    return deal


def get_all_deals() -> list[dict]:
    """Get all deals for the dashboard."""
    conn = _get_db()
    rows = conn.execute("SELECT * FROM deals ORDER BY updated_at DESC").fetchall()
    conn.close()
    deals = []
    for row in rows:
        d = dict(row)
        d["objections"] = json.loads(d.get("objections") or "[]")
        deals.append(d)
    return deals


def get_deal(deal_id: str) -> Optional[dict]:
    """Get a single deal by ID."""
    conn = _get_db()
    row = conn.execute("SELECT * FROM deals WHERE id = ?", (deal_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["objections"] = json.loads(d.get("objections") or "[]")
        return d
    return None


def update_deal(deal_id: str, **kwargs) -> Optional[dict]:
    """Update deal fields."""
    conn = _get_db()
    allowed = {"client_name", "company", "deal_value", "stage", "win_probability",
               "objections", "notes", "ai_recommendation"}
    updates = {k: v for k, v in kwargs.items() if k in allowed}

    if "objections" in updates and isinstance(updates["objections"], list):
        updates["objections"] = json.dumps(updates["objections"])

    if not updates:
        return get_deal(deal_id)

    updates["updated_at"] = datetime.now().isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [deal_id]

    conn.execute(f"UPDATE deals SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return get_deal(deal_id)


def log_interaction(deal_id: str, user_message: str, ai_response: str, memories_used: int = 0):
    """Log an interaction against a deal."""
    conn = _get_db()
    conn.execute(
        """INSERT INTO deal_interactions (id, deal_id, user_message, ai_response, memories_used, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (str(uuid.uuid4()), deal_id, user_message, ai_response, memories_used, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()


def get_deal_interactions(deal_id: str) -> list[dict]:
    """Get all interactions for a deal."""
    conn = _get_db()
    rows = conn.execute(
        "SELECT * FROM deal_interactions WHERE deal_id = ? ORDER BY timestamp DESC",
        (deal_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pipeline_stats() -> dict:
    """Get pipeline analytics."""
    conn = _get_db()
    total = conn.execute("SELECT COUNT(*) as c FROM deals").fetchone()["c"]
    by_stage = conn.execute(
        "SELECT stage, COUNT(*) as count, SUM(deal_value) as value FROM deals GROUP BY stage"
    ).fetchall()
    total_value = conn.execute("SELECT SUM(deal_value) as v FROM deals").fetchone()["v"] or 0
    avg_prob = conn.execute("SELECT AVG(win_probability) as p FROM deals").fetchone()["p"] or 0
    conn.close()

    return {
        "total_deals": total,
        "total_pipeline_value": round(total_value, 2),
        "average_win_probability": round(avg_prob * 100, 1),
        "by_stage": [dict(s) for s in by_stage],
    }
