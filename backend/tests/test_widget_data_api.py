from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Board, User, WidgetData, WidgetInstance
from app.services.portals_service import create_portal


def widget_with_rows(session: Session, owner: User) -> WidgetInstance:
    create_portal(session, owner.id, "Atrium", "wellness-studio", with_sample_data=True)
    row = session.scalars(select(WidgetData)).first()
    assert row is not None
    widget = session.get(WidgetInstance, row.widget_instance_id)
    assert widget is not None
    return widget


def widget_rows(session: Session, widget_id: int) -> list[WidgetData]:
    return list(
        session.scalars(select(WidgetData).where(WidgetData.widget_instance_id == widget_id))
    )


def test_list_widget_data_in_id_order(client: TestClient, session: Session, dev_user: User) -> None:
    widget = widget_with_rows(session, dev_user)
    board_id, widget_id = widget.board_id, widget.id

    response = client.get(f"/api/boards/{board_id}/widgets/{widget_id}/data")
    assert response.status_code == 200
    ids = [r["id"] for r in response.json()]
    assert len(ids) > 0
    assert ids == sorted(ids)


def test_create_widget_data_appends_a_row(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    board_id, widget_id = widget.board_id, widget.id

    response = client.post(
        f"/api/boards/{board_id}/widgets/{widget_id}/data", json={"data": {"quote": "Run, runner"}}
    )
    assert response.status_code == 201

    created = response.json()

    response = client.get(f"/api/boards/{board_id}/widgets/{widget_id}/data")
    assert response.status_code == 200

    rows = response.json()
    assert rows[-1]["id"] == created["id"]
    assert rows[-1]["data"] == {"quote": "Run, runner"}


def test_create_widget_data_without_data_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)

    board_id, widget_id = widget.board_id, widget.id

    response = client.post(f"/api/boards/{board_id}/widgets/{widget_id}/data")
    assert response.status_code == 422


def test_create_widget_data_on_a_stat_widget_is_422(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]

    response = client.post(
        f"/api/boards/{overview['id']}/widgets", json={"type": "stat", "w": 3, "h": 2}
    )

    widget = response.json()
    response = client.post(
        f"/api/boards/{widget['board_id']}/widgets/{widget['id']}/data",
        json={"data": {"quote": "Run, runner"}},
    )

    assert response.status_code == 422


def test_widget_on_another_board_is_404(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    board = session.get(Board, widget.board_id)
    assert board is not None
    # Another board in the same portal: the user owns it, but the widget isn't on it.
    other_board = session.scalar(
        select(Board).where(Board.portal_id == board.portal_id, Board.id != board.id)
    )
    assert other_board is not None
    url = f"/api/boards/{other_board.id}/widgets/{widget.id}/data"
    rows_before = len(widget_rows(session, widget.id))

    get_response = client.get(url)
    post_response = client.post(url, json={"data": {"quote": "Run, runner"}})

    assert get_response.status_code == 404
    assert post_response.status_code == 404
    assert len(widget_rows(session, widget.id)) == rows_before


def test_imaginary_board_or_widget_404(
    session: Session, dev_user: User, client: TestClient
) -> None:
    widget = widget_with_rows(session, dev_user)
    board_id, widget_id = widget.board_id, widget.id

    response = client.post(f"/api/boards/666/widgets/{widget_id}/data", json={"data": {"a": 1}})
    assert response.status_code == 404

    response = client.post(f"/api/boards/{board_id}/widgets/666/data", json={"data": {"a": 1}})
    assert response.status_code == 404


def test_other_users_widget_data_is_protected(
    session: Session, other_user: User, client: TestClient
) -> None:
    # The portal belongs to someone else; the API acts as the dev user.
    widget = widget_with_rows(session, other_user)
    board_id, widget_id = widget.board_id, widget.id
    url = f"/api/boards/{board_id}/widgets/{widget_id}/data"
    rows_before = len(widget_rows(session, widget_id))

    get_response = client.get(url)
    post_response = client.post(url, json={"data": {"quote": "Run, runner"}})

    assert get_response.status_code == 404
    assert post_response.status_code == 404
    assert len(widget_rows(session, widget_id)) == rows_before
