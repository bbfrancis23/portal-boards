import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.config import Settings, get_settings
from app.main import app


def test_settings_read_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CLAUDE_MODEL", "test_model")
    monkeypatch.setenv("AI_ENABLED", "false")

    settings = Settings()

    assert settings.claude_model == "test_model"
    assert settings.ai_enabled is False


def test_secrets_are_hidden(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "super-secret-but-long-enough-to-be-allowed")

    settings = Settings()
    assert "super-secret-but-long-enough-to-be-allowed" not in str(settings.jwt_secret)
    assert settings.jwt_secret.get_secret_value() == "super-secret-but-long-enough-to-be-allowed"


@pytest.mark.parametrize("secret", ["", "abc"])
def test_app_refuses_to_start_with_a_weak_jwt_secret(
    monkeypatch: pytest.MonkeyPatch, secret: str
) -> None:
    monkeypatch.setattr(get_settings(), "jwt_secret", SecretStr(secret))

    with pytest.raises(RuntimeError, match="JWT_SECRET"), TestClient(app):
        pass
