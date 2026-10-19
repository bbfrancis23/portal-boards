from datetime import timedelta

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.models import User, utcnow

# The `client` fixture's cookie lives under this domain; setting one here replaces it.
TEST_DOMAIN = "testserver.local"


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


def test_dev_login_is_404_when_turned_off(anonymous_client: TestClient) -> None:
    assert anonymous_client.post("/api/auth/dev-login").status_code == 404
    assert anonymous_client.get("/api/users/me").status_code == 401


def test_dev_login_logs_you_in_when_turned_on(
    anonymous_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "dev_login_enabled", True)

    response = anonymous_client.post("/api/auth/dev-login")

    assert response.status_code == 204
    me = anonymous_client.get("/api/users/me")
    assert me.status_code == 200
    assert me.json()["email"] == "dev@portal-boards.local"
