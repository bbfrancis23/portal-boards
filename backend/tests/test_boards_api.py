from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, User, WidgetData, WidgetInstance
from app.services.portals_service import create_portal


def count(session: Session, model: type) -> int:
    return session.scalar(select(func.count()).select_from(model)) or 0


def new_portal(client: TestClient, template_id: str | None = None) -> int:
    body = {"name": "Atrium", "template_id": template_id}
    return client.post("/api/portals", json=body).json()["id"]


def test_list_boards_in_position_order(client: TestClient) -> None:
    portal_id = new_portal(client, "wellness-studio")

    response = client.get(f"/api/portals/{portal_id}/boards")

    assert response.status_code == 200
    assert [board["position"] for board in response.json()] == [0, 1, 2, 3]


def test_create_board_goes_at_the_end(client: TestClient) -> None:
    portal_id = new_portal(client)

    first = client.post(f"/api/portals/{portal_id}/boards", json={"label": "First"})
    second = client.post(f"/api/portals/{portal_id}/boards", json={"label": "Second"})

    assert first.status_code == 201
    assert first.json()["position"] == 0
    assert second.json()["position"] == 1
    assert second.json()["portal_id"] == portal_id


def test_create_board_with_empty_label_is_422(client: TestClient) -> None:
    portal_id = new_portal(client)
    assert client.post(f"/api/portals/{portal_id}/boards", json={"label": ""}).status_code == 422


def test_update_board_changes_only_what_was_sent(client: TestClient) -> None:
    portal_id = new_portal(client)
    board_id = client.post(f"/api/portals/{portal_id}/boards", json={"label": "Old"}).json()["id"]

    renamed = client.patch(f"/api/boards/{board_id}", json={"label": "New"})
    moved = client.patch(f"/api/boards/{board_id}", json={"position": 5})

    assert renamed.status_code == 200
    assert renamed.json()["label"] == "New"
    assert moved.json()["label"] == "New"
    assert moved.json()["position"] == 5


def test_delete_board_deletes_its_widgets_and_data(
    client: TestClient, session: Session, dev_user: User
) -> None:
    portal = create_portal(session, dev_user.id, "Atrium", "wellness-studio", with_sample_data=True)
    members = session.scalar(
        select(Board).where(Board.portal_id == portal.id, Board.label == "Members")
    )
    assert members is not None
    widgets_before = count(session, WidgetInstance)
    data_before = count(session, WidgetData)

    response = client.delete(f"/api/boards/{members.id}")

    assert response.status_code == 204
    labels = [board["label"] for board in client.get(f"/api/portals/{portal.id}/boards").json()]
    assert labels == ["Overview", "Schedule", "Revenue"]
    assert count(session, WidgetInstance) < widgets_before
    assert count(session, WidgetData) < data_before


def test_missing_portal_or_board_is_404(client: TestClient) -> None:
    assert client.post("/api/portals/999/boards", json={"label": "X"}).status_code == 404
    assert client.patch("/api/boards/999", json={"label": "X"}).status_code == 404
    assert client.delete("/api/boards/999").status_code == 404


def test_other_users_boards_are_hidden_and_protected(
    client: TestClient, session: Session, other_user: User
) -> None:
    theirs = create_portal(session, other_user.id, "Theirs", "wellness-studio")
    their_board = session.scalar(select(Board).where(Board.portal_id == theirs.id))
    assert their_board is not None

    assert client.get(f"/api/portals/{theirs.id}/boards").json() == []
    assert client.post(f"/api/portals/{theirs.id}/boards", json={"label": "X"}).status_code == 404
    assert client.patch(f"/api/boards/{their_board.id}", json={"label": "X"}).status_code == 404
    assert client.delete(f"/api/boards/{their_board.id}").status_code == 404
    session.refresh(their_board)
    assert their_board.label == "Overview"
