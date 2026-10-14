from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, Portal, User, WidgetData, WidgetInstance
from app.services.portals_service import create_portal


def count(session: Session, model: type) -> int:
    return session.scalar(select(func.count()).select_from(model)) or 0


def test_list_templates(client: TestClient) -> None:
    response = client.get("/api/templates")

    assert response.status_code == 200
    assert [template["id"] for template in response.json()] == ["wellness-studio"]
    assert response.json()[0]["default_portal_name"] == "Atrium Spa and Wellness"


def test_create_portal_from_template(client: TestClient) -> None:
    response = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    )

    assert response.status_code == 201
    portal = response.json()
    assert portal["name"] == "Atrium"
    assert portal["template_id"] == "wellness-studio"
    boards = client.get(f"/api/portals/{portal['id']}/boards").json()
    assert [board["label"] for board in boards] == ["Overview", "Schedule", "Members", "Revenue"]


def test_create_blank_portal(client: TestClient) -> None:
    response = client.post("/api/portals", json={"name": "Blank"})

    assert response.status_code == 201
    assert response.json()["template_id"] is None
    assert client.get(f"/api/portals/{response.json()['id']}/boards").json() == []


def test_create_portal_with_unknown_template_is_400(client: TestClient, session: Session) -> None:
    response = client.post("/api/portals", json={"name": "Nope", "template_id": "no-such-template"})

    assert response.status_code == 400
    assert count(session, Portal) == 0


def test_create_portal_with_empty_name_is_422(client: TestClient) -> None:
    assert client.post("/api/portals", json={"name": ""}).status_code == 422


def test_list_portals_shows_only_own(
    client: TestClient, session: Session, other_user: User
) -> None:
    client.post("/api/portals", json={"name": "Mine"})
    create_portal(session, other_user.id, "Theirs")

    response = client.get("/api/portals")

    assert response.status_code == 200
    assert [portal["name"] for portal in response.json()] == ["Mine"]


def test_rename_portal(client: TestClient) -> None:
    portal_id = client.post("/api/portals", json={"name": "Atrium"}).json()["id"]

    response = client.patch(f"/api/portals/{portal_id}", json={"name": "Atrium Downtown"})

    assert response.status_code == 200
    assert response.json()["name"] == "Atrium Downtown"


def test_delete_portal_deletes_boards_widgets_and_data(
    client: TestClient, session: Session, dev_user: User
) -> None:
    portal = create_portal(session, dev_user.id, "Atrium", "wellness-studio", with_sample_data=True)
    assert count(session, WidgetData) > 0

    response = client.delete(f"/api/portals/{portal.id}")

    assert response.status_code == 204
    assert count(session, Portal) == 0
    assert count(session, Board) == 0
    assert count(session, WidgetInstance) == 0
    assert count(session, WidgetData) == 0


def test_missing_portal_is_404(client: TestClient) -> None:
    assert client.patch("/api/portals/999", json={"name": "X"}).status_code == 404
    assert client.delete("/api/portals/999").status_code == 404


def test_other_users_portal_is_404_and_unchanged(
    client: TestClient, session: Session, other_user: User
) -> None:
    theirs = create_portal(session, other_user.id, "Theirs")

    assert client.patch(f"/api/portals/{theirs.id}", json={"name": "Hacked"}).status_code == 404
    assert client.delete(f"/api/portals/{theirs.id}").status_code == 404
    session.refresh(theirs)
    assert theirs.name == "Theirs"
