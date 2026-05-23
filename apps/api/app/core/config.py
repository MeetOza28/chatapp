from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import json
from typing import List

_THIS_FILE = Path(__file__).resolve()
_REPO_ROOT = _THIS_FILE.parent.parent.parent.parent.parent
_ENV_FILE  = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    APP_NAME:    str = "ChatApp API"
    APP_VERSION: str = "0.1.0"
    APP_ENV:     str = "development"

    DATABASE_URL: str

    JWT_SECRET_KEY:              str
    JWT_ALGORITHM:               str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── AI (Groq) ─────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL:   str = "llama-3.3-70b-versatile"

    # ── AI (Google — kept for compatibility) ──────────────────
    GOOGLE_API_KEY: str = ""
    AGNO_MODEL:     str = "gemini-2.0-flash"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            if s.startswith("[") and s.endswith("]"):
                try:
                    return [str(x) for x in json.loads(s)]
                except Exception:
                    pass
            return [o.strip() for o in s.split(",") if o.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()