# 🧠 DealMind AI — Sales Intelligence Agent with Memory

> **AI agent that remembers every interaction, learns over time, and provides increasingly intelligent sales insights.**

![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square)
![Memory](https://img.shields.io/badge/Memory-Hindsight--style-blueviolet?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-Groq-orange?style=flat-square)

---

## ✨ What It Does

DealMind AI is a **memory-augmented sales intelligence agent** that:
- 🔗 **Remembers** every past conversation using Hindsight-style memory (retain/recall/reflect)
- 📈 **Learns** patterns across deals, objections, and competitor situations
- 🎯 **Improves** responses progressively — watch the learning indicator evolve
- 💡 **Reflects** on accumulated knowledge to synthesize strategic insights

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)          Backend (FastAPI)
┌────────────────────┐          ┌──────────────────────┐
│ Chat UI            │◄────────►│ Agent Orchestrator   │
│ Memory Panel       │  REST    │ Memory Engine        │
│ Deal Dashboard     │  API     │ Groq LLM Service     │
│ Reflection Modal   │          │ Deal Manager (SQLite) │
└────────────────────┘          └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### 1. Clone & Setup
```bash
cd "Hack with Chennai"

# Create .env file
copy .env.example .env
# Edit .env and add your GROQ_API_KEY

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 2. Run Backend
```bash
cd backend
python main.py
```
Backend starts at `http://localhost:8000` (Swagger docs at `/docs`)

### 3. Open Frontend
Just open `frontend/index.html` in your browser. That's it — no build step needed!

---

## 🧪 Demo Script (60-Second Pitch)

### Step 1: First Interaction (Cold Start → Context Building)
> "What do you know about the TechNova deal?"

The agent pulls from pre-seeded memories — showing it remembers past interactions about pricing pushback and the pilot program suggestion.

### Step 2: Problem Solving (Memory-Augmented Intelligence)
> "Sarah Chen is pushing back on pricing. How should I handle this?"

The agent recalls the specific TechNova pricing objection from memory AND cross-references the general objection pattern insight to give a strategic, contextual answer.

### Step 3: Cross-Deal Intelligence
> "Compare our competitive position against Salesforce for Retail Dynamics"

Watch the agent synthesize knowledge from the Retail Dynamics competitive situation AND the learned insight that "Salesforce deals are won on TCO, not features."

### Step 4: Reflection (The Wow Moment)
Click **Reflect** → "What patterns do you see across all our deals?"

The agent uses the `reflect` operation to analyze all stored memories and produce a synthesized strategic analysis.

**Key demo points for judges:**
- 🧠 learning indicator in the top bar evolves from Cold Start → Expert
- 🔗 Memory badges on each message show how many memories influenced the response
- 📊 Memory panel on the right shows real-time memory accumulation

---

## 📂 Project Structure

```
├── .env.example           # Environment variable template
├── README.md              # This file
├── backend/
│   ├── main.py            # FastAPI server (12 endpoints)
│   ├── agent.py           # Core orchestrator (recall → generate → store)
│   ├── memory_service.py  # Hindsight-style memory engine
│   ├── llm_service.py     # Groq LLM wrapper
│   ├── deal_manager.py    # SQLite deal CRUD
│   ├── seed_data.py       # Sample deals & memories
│   ├── config.py          # Pydantic settings
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── index.html          # Three-panel layout
    ├── style.css           # Premium dark-mode design
    └── app.js              # Frontend application logic
```

## 🧠 Memory System Deep Dive

The memory engine implements three operations mirroring the [Hindsight](https://github.com/vectorize-io/hindsight) API:

| Operation | What it does | When it's used |
|-----------|-------------|----------------|
| **retain()** | Stores a memory with type + metadata | After every chat interaction |
| **recall()** | Retrieves relevant memories via TF-IDF similarity | Before generating each response |
| **reflect()** | Synthesizes insights across memories | On-demand via Reflect button |

Memory types:
- **Experience** — past conversation interactions
- **World** — extracted facts (client info, competitor data)
- **Opinion** — synthesized insights from reflection

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python backend with auto-generated API docs |
| **Groq** | Ultra-fast LLM inference (10x faster than OpenAI) |
| **Hindsight-style Memory** | Structured retain/recall/reflect memory engine |
| **SQLite** | Zero-config deal database |
| **Vanilla HTML/CSS/JS** | Zero-build frontend — just open and go |

---

*Built for hackathon by the DealMind team* 🚀
