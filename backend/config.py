"""
Application configuration via environment variables.
Uses pydantic-settings for validation and .env file loading.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Groq LLM
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Server
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    DB_PATH: str = str(Path(__file__).parent / "data" / "deals.db")

    # Memory
    MEMORY_PERSIST_PATH: str = str(Path(__file__).parent / "data" / "memory.json")

    model_config = {
        "env_file": str(Path(__file__).parent.parent / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
