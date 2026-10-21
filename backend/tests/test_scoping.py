"""No route lets one user read or change another user's portals, boards, widgets or data.

Two real users, each with their own logged-in client (like two browsers): Bob builds his
portal through the API, then I try every route on it. Every attempt must be a 404, as if
Bob's things didn't exist (not 403, which would tell me they do), and must change nothing.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, Portal, User, WidgetData, WidgetInstance


@pytest.fixture
def bobs_portal(bob_client: TestClient) -> dict[str, int]:
    """Bob makes his own Atrium portal and adds a row, all through the API. Returns the ids."""
    portal = bob_client.post(
        "/api/portals", json={"name": "Bob's Atrium", "template_id": "wellness-studio"}
    ).json()
    boards = bob_client.get(f"/api/portals/{portal['id']}/boards").json()
    widget = next(
        widget
        for board in boards
        for widget in bob_client.get(f"/api/boards/{board['id']}/widgets").json()
        if widget["type"] in ("table", "schedule")
    )
    added = bob_client.post(
        f"/api/boards/{widget['board_id']}/widgets/{widget['id']}/data",
        json={"data": {"name": "Bob's row"}},
    )
    assert added.status_code == 201
    return {"portal": portal["id"], "board": widget["board_id"], "widget": widget["id"]}


def count_everything(session: Session) -> tuple[int, ...]:
    """How many portals, boards, widgets and rows exist, to prove a request changed nothing."""
    return tuple(
        session.scalar(select(func.count()).select_from(model)) or 0
        for model in (Portal, Board, WidgetInstance, WidgetData)
    )


# Every route that takes a portal, board or widget id: (method, path, body).
ROUTES: list[tuple[str, str, Any]] = [
    ("PATCH", "/api/portals/{portal}", {"name": "Mine now"}),
    ("DELETE", "/api/portals/{portal}", None),
    ("GET", "/api/portals/{portal}/boards", None),
    ("POST", "/api/portals/{portal}/boards", {"label": "Mine now"}),
    ("PATCH", "/api/boards/{board}", {"label": "Mine now"}),
    ("DELETE", "/api/boards/{board}", None),
    ("GET", "/api/boards/{board}/widgets", None),
    ("POST", "/api/boards/{board}/widgets", {"type": "stat", "w": 3, "h": 2}),
    ("PATCH", "/api/boards/{board}/widgets/layout", []),
    ("PATCH", "/api/widgets/{widget}", {"w": 4}),
    ("DELETE", "/api/widgets/{widget}", None),
    ("GET", "/api/boards/{board}/widgets/{widget}/data", None),
    ("POST", "/api/boards/{board}/widgets/{widget}/data", {"data": {"a": 1}}),
]


@pytest.mark.parametrize(("method", "path", "body"), ROUTES)
def test_i_cant_touch_bobs_stuff(
    client: TestClient,
    session: Session,
    bobs_portal: dict[str, int],
    method: str,
    path: str,
    body: Any,
) -> None:
    url = path.format(**bobs_portal)
    before = count_everything(session)

    response = client.request(method, url, json=body)

    assert response.status_code == 404
    assert count_everything(session) == before


def test_my_portal_list_hides_bobs_portal(client: TestClient, bobs_portal: dict[str, int]) -> None:
    ids = [portal["id"] for portal in client.get("/api/portals").json()]
    assert bobs_portal["portal"] not in ids


def test_bob_still_sees_his_portal(bob_client: TestClient, bobs_portal: dict[str, int]) -> None:
    """The flip side: the 404s are about who's asking, not about Bob's portal being broken."""
    ids = [portal["id"] for portal in bob_client.get("/api/portals").json()]
    assert bobs_portal["portal"] in ids


def test_i_cant_create_a_portal_for_bob(
    client: TestClient, session: Session, dev_user: User, other_user: User
) -> None:
    response = client.post("/api/portals", json={"name": "Sneaky", "owner_id": other_user.id})

    assert response.status_code == 201
    portal = session.get(Portal, response.json()["id"])
    assert portal is not None
    assert portal.owner_id == dev_user.id
