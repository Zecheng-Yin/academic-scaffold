from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings

# Always resolve .env relative to this file's directory (backend/)
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    anthropic_api_key: str
    openai_api_key: str
    claude_model: str = "claude-sonnet-4-6"
    embedding_model: str = "text-embedding-3-small"
    session_ttl_hours: int = 2
    max_pdf_size_mb: int = 20
    # Stored as comma-separated string in .env; use cors_origins_list property
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
