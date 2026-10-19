from datetime import timedelta
from typing import Any
from unittest.mock import AsyncMock, Mock

import jwt
import pytest
from authlib.integrations.starlette_client import OAuthError
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import User, utcnow
from app.oauth import oauth

# The `client` fixture's cookie lives under this domain; setting one here replaces it.
TEST_DOMAIN = "testserver.local"


def fake_github(
    monkeypatch: pytest.MonkeyPatch, user_json: dict[str, Any], emails_json: list[dict[str, Any]]
) -> None:
    """Pretend GitHub approved the log-in and has this profile and these emails."""
    monkeypatch.setattr(
        oauth.github, "authorize_access_token", AsyncMock(return_value={"access_token": "t"})
    )

    async def fake_get(path, token):  # the callback calls get("user") and get("user/emails")
        return Mock(json=Mock(return_value=user_json if path == "user" else emails_json))

    monkeypatch.setattr(oauth.github, "get", fake_get)


def fake_google(monkeypatch: pytest.MonkeyPatch, userinfo: dict[str, Any]) -> None:
    """Pretend Google approved the log-in; its ID token carries this userinfo."""
    monkeypatch.setattr(
        oauth.google, "authorize_access_token", AsyncMock(return_value={"userinfo": userinfo})
    )


def github_user(github_id: int = 42, name: str = "New Person") -> dict[str, Any]:
    return {"id": github_id, "login": "newbie", "name": name, "avatar_url": None}


def verified(email: str) -> list[dict[str, Any]]:
    return [{"email": email, "primary": True, "verified": True}]


def count_users(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(User)) or 0


def make_token(user_id: int, issued: timedelta) -> str:
    """A real, correctly signed token, issued `issued` ago and valid for 7 days from then."""
    iat = utcnow() - issued
    return jwt.encode(
        {"sub": str(user_id), "iat": iat, "exp": iat + timedelta(days=7)},
        get_settings().jwt_secret.get_secret_value(),
        algorithm="HS256",
    )


def test_protected_route_without_a_cookie_is_401(anonymous_client: TestClient) -> None:
    response = anonymous_client.post("/api/portals", json={"name": "Blank"})
    assert response.status_code == 401


def test_bad_token_is_401(client: TestClient) -> None:
    client.cookies.set("pb_session", "not-a-real-token", domain=TEST_DOMAIN)
    response = client.post("/api/portals", json={"name": "Blank"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired session"


def test_expired_token_is_401(client: TestClient, dev_user: User) -> None:
    client.cookies.set("pb_session", make_token(dev_user.id, timedelta(days=8)), domain=TEST_DOMAIN)
    response = client.post("/api/portals", json={"name": "Blank"})
    assert response.status_code == 401


def test_me_returns_the_logged_in_user(client: TestClient, dev_user: User) -> None:
    response = client.get("/api/users/me")
    assert response.status_code == 200
    assert response.json()["id"] == dev_user.id


def test_logout_logs_you_out(client: TestClient) -> None:
    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    assert client.cookies.get("pb_session") is None
    assert client.get("/api/users/me").status_code == 401


def test_old_token_gets_renewed(client: TestClient, dev_user: User) -> None:
    old_token = make_token(dev_user.id, timedelta(days=2))
    client.cookies.set("pb_session", old_token, domain=TEST_DOMAIN)

    response = client.get("/api/users/me")

    assert response.status_code == 200
    new_token = client.cookies.get("pb_session")
    assert new_token is not None
    assert new_token != old_token
    # The new token was issued just now, so it's good for another 7 days.
    claims = jwt.decode(
        new_token, get_settings().jwt_secret.get_secret_value(), algorithms=["HS256"]
    )
    assert utcnow().timestamp() - claims["iat"] < 60


def test_fresh_token_is_not_renewed(client: TestClient) -> None:
    response = client.get("/api/users/me")

    assert response.status_code == 200
    assert "set-cookie" not in response.headers


def test_github_callback_logs_in_a_new_user(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake_github(
        monkeypatch,
        user_json={"id": 42, "login": "newbie", "name": "New Person", "avatar_url": None},
        emails_json=[{"email": "new@example.com", "primary": True, "verified": True}],
    )
    response = anonymous_client.get("/api/auth/github/callback", follow_redirects=False)
    assert response.status_code == 307
    assert "pb_session" in response.cookies
    me = anonymous_client.get("/api/users/me").json()
    assert me["email"] == "new@example.com"


def test_github_callback_for_a_returning_user_keeps_the_same_user(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch, session: Session
) -> None:
    fake_github(monkeypatch, github_user(name="Old Name"), verified("new@example.com"))
    anonymous_client.get("/api/auth/github/callback", follow_redirects=False)
    first = anonymous_client.get("/api/users/me").json()

    fake_github(monkeypatch, github_user(name="New Name"), verified("new@example.com"))
    anonymous_client.get("/api/auth/github/callback", follow_redirects=False)
    again = anonymous_client.get("/api/users/me").json()

    assert again["id"] == first["id"]
    assert again["display_name"] == "New Name"
    assert count_users(session) == 1


def test_google_with_the_same_email_logs_into_the_github_user(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch, session: Session
) -> None:
    fake_github(monkeypatch, github_user(), verified("brian@example.com"))
    anonymous_client.get("/api/auth/github/callback", follow_redirects=False)
    github_me = anonymous_client.get("/api/users/me").json()
    anonymous_client.post("/api/auth/logout")

    fake_google(
        monkeypatch,
        {"sub": "g-1", "email": "brian@example.com", "email_verified": True, "name": "Brian"},
    )
    response = anonymous_client.get("/api/auth/google/callback", follow_redirects=False)

    assert response.status_code == 307
    assert anonymous_client.get("/api/users/me").json()["id"] == github_me["id"]
    assert count_users(session) == 1


def test_google_with_an_unverified_email_is_not_logged_in(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch, session: Session
) -> None:
    fake_github(monkeypatch, github_user(), verified("brian@example.com"))
    anonymous_client.get("/api/auth/github/callback", follow_redirects=False)
    anonymous_client.post("/api/auth/logout")

    fake_google(
        monkeypatch,
        {"sub": "g-1", "email": "brian@example.com", "email_verified": False, "name": "Brian"},
    )
    response = anonymous_client.get("/api/auth/google/callback", follow_redirects=False)

    assert response.headers["location"].endswith("/log-in")
    assert "pb_session" not in response.cookies
    assert anonymous_client.get("/api/users/me").status_code == 401
    assert count_users(session) == 1


def test_github_without_a_verified_email_is_never_linked(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch, session: Session
) -> None:
    fake_google(
        monkeypatch,
        {"sub": "g-1", "email": "brian@example.com", "email_verified": True, "name": "Brian"},
    )
    anonymous_client.get("/api/auth/google/callback", follow_redirects=False)
    google_me = anonymous_client.get("/api/users/me").json()
    anonymous_client.post("/api/auth/logout")

    unverified = [{"email": "brian@example.com", "primary": True, "verified": False}]
    fake_github(monkeypatch, github_user(), unverified)
    anonymous_client.get("/api/auth/github/callback", follow_redirects=False)

    github_me = anonymous_client.get("/api/users/me").json()
    assert github_me["id"] != google_me["id"]
    assert github_me["email"] is None
    assert count_users(session) == 2


@pytest.mark.parametrize("provider", ["github", "google"])
def test_cancelled_log_in_goes_back_to_the_log_in_page(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch, provider: str
) -> None:
    client_for = getattr(oauth, provider)
    monkeypatch.setattr(
        client_for, "authorize_access_token", AsyncMock(side_effect=OAuthError("access_denied"))
    )

    response = anonymous_client.get(f"/api/auth/{provider}/callback", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"].endswith("/log-in")
    assert "pb_session" not in response.cookies
