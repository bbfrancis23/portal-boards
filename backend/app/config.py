from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_url: str = "http://localhost:5173"
    jwt_secret: SecretStr = SecretStr("")
    session_secret: SecretStr = SecretStr("")

    # Database
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'portal_boards.db').as_posix()}"
    turso_auth_token: SecretStr = SecretStr("")

    # OAuth
    github_client_id: str = ""
    github_client_secret: SecretStr = SecretStr("")
    google_client_id: str = ""
    google_client_secret: SecretStr = SecretStr("")

    # Claude
    anthropic_api_key: SecretStr = SecretStr("")
    claude_model: str = "claude-sonnet-5-5"
    ai_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
