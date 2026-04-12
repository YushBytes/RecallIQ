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
) -> str:
    """
    Generate a chat completion via Groq.

    Args:
        system_prompt: System instruction for the LLM
        messages: List of {"role": "user"|"assistant", "content": "..."} dicts
        temperature: Creativity control (0-1)
        max_tokens: Max response length

    Returns:
        The assistant's response text
    """
    client = _get_client()

    full_messages = [{"role": "system", "content": system_prompt}]
    full_messages.extend(messages)

    completion = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=full_messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

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
