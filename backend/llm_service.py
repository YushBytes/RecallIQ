"""
Groq LLM Service — ultra-fast inference wrapper.

Provides a simple interface for chat completions with
system prompts, conversation history, and memory context injection.
"""

import os
from groq import Groq

from config import settings

# Initialize Groq client
_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not set. Get a free key at https://console.groq.com"
            )
        _client = Groq(api_key=api_key)
    return _client


def generate_response(
    system_prompt: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> str:
    """
    Generate a chat completion via Groq.

    Args:
        system_prompt: System instruction for the LLM
        messages: List of {"role": "user"|"assistant", "content": "..."} dicts
        temperature: Creativity control (0-1)
        max_tokens: Max response length
        json_mode: Option to compel JSON object output

    Returns:
        The assistant's response text
    """
    client = _get_client()

    full_messages = [{"role": "system", "content": system_prompt}]
    full_messages.extend(messages)

    kwargs = {
        "model": settings.GROQ_MODEL,
        "messages": full_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    completion = client.chat.completions.create(**kwargs)

    return completion.choices[0].message.content or ""


def generate_reflection(memories_context: str, query: str) -> str:
    """
    Generate a reflection/synthesis from accumulated memories.
    Used by the reflect() operation to produce insights.
    """
    system_prompt = (
        "You are an AI sales intelligence analyst. You are reflecting on past "
        "interactions and knowledge to synthesize actionable insights. "
        "Be specific, reference past interactions, and provide strategic recommendations. "
        "Keep your reflection concise but insightful (3-5 key points)."
    )

    messages = [
        {
            "role": "user",
            "content": f"{memories_context}\n\nReflection query: {query}",
        }
    ]

    return generate_response(system_prompt, messages, temperature=0.5, max_tokens=512)


def extract_deal_updates(user_text: str) -> str:
    """
    Extract deal-specific intelligence from user message for CRM updates.
    """
    system_prompt = (
        "You are an expert sales analyst. Analyze the user's message and predict updates for the deal pipeline. "
        "Return a JSON object with: "
        "'suggested_stage' (qualification|discovery|proposal|negotiation|closed_won|closed_lost|null), "
        "'new_objections' (list of strings), "
        "'win_probability_delta' (float between -0.5 and 0.5), "
        "'sentiment' (string: positive|neutral|negative). "
        "Output valid JSON only."
    )
    messages = [{"role": "user", "content": user_text}]
    return generate_response(system_prompt, messages, temperature=0.1, max_tokens=256, json_mode=True)


def summarize_context(raw_memories: list, user_query: str) -> str:
    """
    Condense raw memories into a focused context paragraph.
    """
    if not raw_memories:
        return ""
        
    memory_text = "\n".join([f"- {m['memory_type'].upper()}: {m['content']}" for m in raw_memories])
    system_prompt = (
        "You are a sales intelligence summarizer. Given a list of past memories and the current user query, "
        "write a single, cohesive paragraph that summarizes the most relevant context. "
        "Filter out irrelevant details and avoid hallucinations."
    )
    messages = [
        {"role": "user", "content": f"User Query: {user_query}\n\nMemories:\n{memory_text}"}
    ]
    return generate_response(system_prompt, messages, temperature=0.3, max_tokens=250)


def generate_dossier(deal: dict, memories: list) -> str:
    """
    Generate a strategic dossier based on a deal and its memories.
    """
    memory_text = "\n".join([f"- {m['memory_type'].upper()}: {m['content']}" for m in memories])
    deal_info = (
        f"Client: {deal.get('client_name')}\nCompany: {deal.get('company')}\n"
        f"Value: ${deal.get('deal_value')}\nStage: {deal.get('stage')}\n"
        f"Probability: {deal.get('win_probability')}\n"
        f"Notes: {deal.get('notes')}\n"
        f"Objections: {deal.get('objections', [])}"
    )
    system_prompt = (
        "You are an elite enterprise sales strategist. Output a 1-page Strategic Dossier in Markdown format. "
        "Use Sections like: Executive Summary, Client State (sentiment/objections), and Recommended Playbook. "
        "Base your advice entirely on the provided Deal Info and Past Memories. Be highly actionable."
    )
    messages = [
        {"role": "user", "content": f"## Deal Info\n{deal_info}\n\n## Past Memories\n{memory_text}"}
    ]
    return generate_response(system_prompt, messages, temperature=0.5, max_tokens=800)
