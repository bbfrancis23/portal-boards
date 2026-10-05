import pytest

from app.config import Settings


def test_settings_read_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CLAUDE_MODEL", "test_model")
    monkeypatch.setenv("AI_ENABLED", "false")

    settings = Settings()

    assert settings.claude_model == "test_model"
    assert settings.ai_enabled is False


def test_secrets_are_hidden(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "super-secret")

    settings = Settings()
    assert "super-secret" not in str(settings.jwt_secret)
    assert settings.jwt_secret.get_secret_value() == "super-secret"
