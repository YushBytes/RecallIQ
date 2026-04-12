"""
Seed Data — pre-loads realistic sample deals and past interactions.

This creates a compelling demo experience from the very first launch by
showing the agent already has some memory context to work with.
"""

from deal_manager import create_deal, get_all_deals, init_db, update_deal
from memory_service import memory_engine


SAMPLE_DEALS = [
    {
        "client_name": "Sarah Chen",
        "company": "TechNova Solutions",
        "deal_value": 125000,
        "stage": "negotiation",
        "notes": "Enterprise SaaS deal, 200-seat deployment. Decision maker is VP of Engineering.",
    },
    {
        "client_name": "Marcus Johnson",
        "company": "Retail Dynamics Inc",
        "deal_value": 85000,
        "stage": "proposal",
        "notes": "Mid-market retail chain, 50 locations. Competing against Salesforce.",
    },
    {
        "client_name": "Priya Patel",
        "company": "FinEdge Capital",
        "deal_value": 250000,
        "stage": "discovery",
        "notes": "Financial services firm. Strict compliance requirements. Budget approved by CFO.",
    },
    {
        "client_name": "James O'Brien",
        "company": "GreenLeaf Manufacturing",
        "deal_value": 67000,
        "stage": "prospecting",
        "notes": "Manufacturing company looking to digitize sales process. First-time buyer.",
    },
    {
        "client_name": "Aisha Williams",
        "company": "CloudFirst Media",
        "deal_value": 180000,
        "stage": "closed_won",
        "notes": "Media company, signed last month. Great reference customer.",
    },
]


SAMPLE_MEMORIES = [
    # Past experiences
    {
        "content": "User asked: Sarah Chen from TechNova pushed back on our pricing — says it's 30% above budget. Agent responded: Suggested value-based reframing — focus on ROI per seat, offer pilot program for 50 seats at reduced rate to prove value before full deployment.",
        "memory_type": "experience",
        "metadata": {"deal": "TechNova Solutions"},
    },
    {
        "content": "User asked: Marcus at Retail Dynamics is comparing us to Salesforce. What should I do? Agent responded: Recommended highlighting our retail-specific features, faster implementation (6 weeks vs 6 months), and lower TCO. Suggested arranging a call with our Retail Dynamics reference customer.",
        "memory_type": "experience",
        "metadata": {"deal": "Retail Dynamics Inc"},
    },
    {
        "content": "User asked: Priya from FinEdge is concerned about data compliance. Agent responded: Recommended sharing our SOC2 Type II certification, offering a security review session with our CISO, and providing the compliance documentation package.",
        "memory_type": "experience",
        "metadata": {"deal": "FinEdge Capital"},
    },
    {
        "content": "User asked: How do I handle a prospect who keeps delaying the decision? Agent responded: Advised creating urgency through limited-time pilot pricing, identifying the hidden blocker (often internal politics), and suggesting a 'mini-commitment' approach — get agreement on a smaller scope first.",
        "memory_type": "experience",
        "metadata": {"deal": "general"},
    },
    {
        "content": "User asked: We just closed the CloudFirst Media deal! Agent responded: Congratulations! Recommended documenting the winning strategy for future reference — key factors were: strong executive sponsorship, custom demo tailored to media workflows, and competitive displacement during contract renewal window.",
        "memory_type": "experience",
        "metadata": {"deal": "CloudFirst Media"},
    },
    # World facts
    {
        "content": "TechNova Solutions has 500 employees, $50M annual revenue, headquartered in Austin, TX. VP of Engineering (Sarah Chen's boss) is the final decision maker.",
        "memory_type": "world",
        "metadata": {"source": "extracted_fact"},
    },
    {
        "content": "Retail Dynamics Inc operates 50 retail locations across the Midwest. Currently using Salesforce but unhappy with customization costs. Contract renewal coming up in Q3.",
        "memory_type": "world",
        "metadata": {"source": "extracted_fact"},
    },
    {
        "content": "Common objection pattern: pricing concerns appear in 70% of enterprise deals. Most effective counter-strategy is value-based selling with ROI calculator.",
        "memory_type": "world",
        "metadata": {"source": "objection_tracking"},
    },
    # Opinions / learned insights
    {
        "content": "Based on past interactions, deals in the 'negotiation' stage with pricing objections have a 60% close rate when we offer a pilot program, versus 25% with straight discounting.",
        "memory_type": "opinion",
        "metadata": {"source": "self_reflection"},
    },
    {
        "content": "Competitive deals against Salesforce are best won by emphasizing implementation speed and total cost of ownership rather than feature comparison.",
        "memory_type": "opinion",
        "metadata": {"source": "self_reflection"},
    },
]


def seed_data():
    """Seed the database and memory with sample data. Idempotent — skips if data exists."""
    # Initialize database
    init_db()

    # Seed deals (only if empty)
    existing_deals = get_all_deals()
    if not existing_deals:
        deals = []
        for deal_data in SAMPLE_DEALS:
            deal = create_deal(**deal_data)
            deals.append(deal)

        # Update some deals with extra data
        if len(deals) >= 5:
            update_deal(deals[0]["id"], objections=["pricing", "implementation timeline"], win_probability=0.55)
            update_deal(deals[1]["id"], objections=["competitor preference", "change management"], win_probability=0.40)
            update_deal(deals[2]["id"], objections=["compliance concerns", "data residency"], win_probability=0.35)
            update_deal(deals[3]["id"], win_probability=0.15)
            update_deal(deals[4]["id"], win_probability=1.0, stage="closed_won")

        print(f"[OK] Seeded {len(deals)} sample deals")

    # Seed memories (only if bank is empty)
    bank = memory_engine.get_or_create_bank(
        "deal-intelligence-agent",
        "An AI sales intelligence agent that remembers all past interactions."
    )

    if not bank.memories:
        for mem_data in SAMPLE_MEMORIES:
            memory_engine.retain(
                memory_bank_id=bank.id,
                content=mem_data["content"],
                memory_type=mem_data["memory_type"],
                metadata=mem_data["metadata"],
            )
        print(f"[OK] Seeded {len(SAMPLE_MEMORIES)} sample memories")
    else:
        print(f"[INFO] Memory bank already has {len(bank.memories)} memories, skipping seed")


if __name__ == "__main__":
    seed_data()
