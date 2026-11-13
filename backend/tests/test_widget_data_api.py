from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Board, User, WidgetData, WidgetInstance
from app.services.portals_service import create_portal


def widget_with_rows(session: Session, owner: User) -> WidgetInstance:
    create_portal(session, owner.id, "Atrium", template_id="wellness-studio", with_sample_data=True)
    row = session.scalars(select(WidgetData)).first()
    assert row is not None
    widget = session.get(WidgetInstance, row.widget_instance_id)
    assert widget is not None
    return widget


# The sample portal's first rows are Members, which requires Name, Membership and Status.
ANN = {"name": "Ann", "membership": "Drop-in", "status": "active"}


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


def test_list_widget_data_by_widget_id_alone(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    board_id, widget_id = widget.board_id, widget.id

    by_board = client.get(f"/api/boards/{board_id}/widgets/{widget_id}/data").json()
    response = client.get(f"/api/widgets/{widget_id}/data")

    assert response.status_code == 200
    assert response.json() == by_board


def test_widget_data_by_id_for_an_imaginary_widget_is_404(client: TestClient) -> None:
    assert client.get("/api/widgets/666/data").status_code == 404


def test_other_users_widget_data_by_id_is_404(
    session: Session, other_user: User, client: TestClient
) -> None:
    widget = widget_with_rows(session, other_user)

    assert client.get(f"/api/widgets/{widget.id}/data").status_code == 404


def test_create_widget_data_appends_a_row(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    board_id, widget_id = widget.board_id, widget.id

    response = client.post(f"/api/boards/{board_id}/widgets/{widget_id}/data", json={"data": ANN})
    assert response.status_code == 201

    created = response.json()

    response = client.get(f"/api/boards/{board_id}/widgets/{widget_id}/data")
    assert response.status_code == 200

    rows = response.json()
    assert rows[-1]["id"] == created["id"]
    assert rows[-1]["data"] == ANN


def test_create_widget_data_without_data_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)

    board_id, widget_id = widget.board_id, widget.id

    response = client.post(f"/api/boards/{board_id}/widgets/{widget_id}/data")
    assert response.status_code == 422


def test_create_widget_data_with_an_empty_row_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.post(
        f"/api/boards/{widget.board_id}/widgets/{widget.id}/data", json={"data": {}}
    )

    assert response.status_code == 422
    assert len(widget_rows(session, widget.id)) == rows_before


def test_create_widget_data_on_a_stat_widget_is_422(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    widgets = client.get(f"/api/boards/{overview['id']}/widgets").json()
    widget = next(widget for widget in widgets if widget["type"] == "stat")

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


def test_update_widget_data_replaces_the_row(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row_id = widget_rows(session, widget.id)[0].id

    ann_with_visits = {**ANN, "visits": 7}

    response = client.patch(
        f"/api/widgets/{widget.id}/data/{row_id}", json={"data": ann_with_visits}
    )

    assert response.status_code == 200
    assert response.json()["data"] == ann_with_visits
    rows = client.get(f"/api/widgets/{widget.id}/data").json()
    assert next(r for r in rows if r["id"] == row_id)["data"] == ann_with_visits


def test_update_widget_data_with_an_empty_row_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row = widget_rows(session, widget.id)[0]
    data_before = row.data

    response = client.patch(f"/api/widgets/{widget.id}/data/{row.id}", json={"data": {}})

    assert response.status_code == 422
    session.refresh(row)
    assert row.data == data_before


def test_create_widget_data_without_a_required_column_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))
    without_status = {key: value for key, value in ANN.items() if key != "status"}

    response = client.post(
        f"/api/boards/{widget.board_id}/widgets/{widget.id}/data", json={"data": without_status}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == [
        {
            "type": "missing",
            "loc": ["body", "data", "status"],
            "msg": "Status is required",
            "input": None,
        }
    ]
    assert len(widget_rows(session, widget.id)) == rows_before


def test_a_blank_required_column_counts_as_missing(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)

    response = client.post(
        f"/api/boards/{widget.board_id}/widgets/{widget.id}/data",
        json={"data": {**ANN, "name": "", "membership": None}},
    )

    assert response.status_code == 422
    missing = [problem["loc"][-1] for problem in response.json()["detail"]]
    assert missing == ["name", "membership"]


def test_update_widget_data_without_a_required_column_is_422_and_not_saved(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row = widget_rows(session, widget.id)[0]
    data_before = row.data

    response = client.patch(
        f"/api/widgets/{widget.id}/data/{row.id}", json={"data": {**ANN, "status": ""}}
    )

    assert response.status_code == 422
    session.refresh(row)
    assert row.data == data_before


def test_schedules_have_no_required_columns(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    boards = client.get(f"/api/portals/{portal_id}/boards").json()
    schedule_board = next(board for board in boards if board["label"] == "Schedule")
    widgets = client.get(f"/api/boards/{schedule_board['id']}/widgets").json()
    schedule = next(widget for widget in widgets if widget["type"] == "schedule")

    response = client.post(
        f"/api/boards/{schedule['board_id']}/widgets/{schedule['id']}/data",
        json={"data": {"title": "Yoga", "start": "2026-11-09T06:30", "end": "2026-11-09T07:30"}},
    )

    assert response.status_code == 201


def test_update_a_row_through_another_widget_is_404(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row_elsewhere = session.scalar(
        select(WidgetData).where(WidgetData.widget_instance_id != widget.id)
    )
    assert row_elsewhere is not None

    response = client.patch(
        f"/api/widgets/{widget.id}/data/{row_elsewhere.id}", json={"data": {"a": 1}}
    )

    assert response.status_code == 404


def test_update_an_imaginary_row_is_404(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)

    response = client.patch(f"/api/widgets/{widget.id}/data/666666", json={"data": {"a": 1}})

    assert response.status_code == 404


def test_update_other_users_widget_data_is_404(
    session: Session, other_user: User, client: TestClient
) -> None:
    widget = widget_with_rows(session, other_user)
    row = widget_rows(session, widget.id)[0]
    data_before = row.data

    response = client.patch(f"/api/widgets/{widget.id}/data/{row.id}", json={"data": {"a": 1}})

    assert response.status_code == 404
    session.refresh(row)
    assert row.data == data_before


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


def test_delete_widget_data_deletes_the_row(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row_id = widget_rows(session, widget.id)[0].id

    response = client.delete(f"/api/widgets/{widget.id}/data/{row_id}")

    assert response.status_code == 204
    assert row_id not in [row.id for row in widget_rows(session, widget.id)]


def test_delete_other_users_widget_data_is_404(
    session: Session, other_user: User, client: TestClient
) -> None:
    widget = widget_with_rows(session, other_user)
    row = widget_rows(session, widget.id)[0]
    data_before = row.data

    response = client.delete(f"/api/widgets/{widget.id}/data/{row.id}")

    assert response.status_code == 404
    session.refresh(row)
    assert row.data == data_before


def test_delete_a_row_through_another_widget_is_404(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    row_elsewhere = session.scalar(
        select(WidgetData).where(WidgetData.widget_instance_id != widget.id)
    )
    assert row_elsewhere is not None

    response = client.delete(f"/api/widgets/{widget.id}/data/{row_elsewhere.id}")

    assert response.status_code == 404
    rows_still_there = widget_rows(session, row_elsewhere.widget_instance_id)
    assert row_elsewhere.id in [row.id for row in rows_still_there]


def test_delete_an_imaginary_row_is_404(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.delete(f"/api/widgets/{widget.id}/data/666666")

    assert response.status_code == 404
    assert len(widget_rows(session, widget.id)) == rows_before


BO = {"name": "Bo", "membership": "10-class pack", "status": "inactive"}


def bulk_url(widget: WidgetInstance) -> str:
    return f"/api/boards/{widget.board_id}/widgets/{widget.id}/data/bulk"


def test_bulk_create_adds_every_row_in_order(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.post(bulk_url(widget), json={"rows": [{"data": ANN}, {"data": BO}]})

    assert response.status_code == 201
    assert [row["data"] for row in response.json()] == [ANN, BO]
    rows = client.get(f"/api/widgets/{widget.id}/data").json()
    assert len(rows) == rows_before + 2
    assert [row["data"] for row in rows[-2:]] == [ANN, BO]


def test_bulk_create_with_a_missing_required_column_adds_no_rows(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))
    bo_without_status = {key: value for key, value in BO.items() if key != "status"}

    response = client.post(
        bulk_url(widget), json={"rows": [{"data": ANN}, {"data": bo_without_status}]}
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "rows", 1, "data", "status"]
    assert len(widget_rows(session, widget.id)) == rows_before


def test_bulk_create_with_an_empty_row_adds_no_rows(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.post(bulk_url(widget), json={"rows": [{"data": ANN}, {"data": {}}]})

    assert response.status_code == 422
    assert len(widget_rows(session, widget.id)) == rows_before


def test_bulk_create_with_no_rows_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)

    assert client.post(bulk_url(widget), json={"rows": []}).status_code == 422


def test_bulk_create_on_a_stat_widget_is_422(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    widgets = client.get(f"/api/boards/{overview['id']}/widgets").json()
    stat = next(widget for widget in widgets if widget["type"] == "stat")

    response = client.post(
        f"/api/boards/{stat['board_id']}/widgets/{stat['id']}/data/bulk",
        json={"rows": [{"data": ANN}]},
    )

    assert response.status_code == 422


def test_bulk_create_on_other_users_widget_is_404(
    session: Session, other_user: User, client: TestClient
) -> None:
    widget = widget_with_rows(session, other_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.post(bulk_url(widget), json={"rows": [{"data": ANN}]})

    assert response.status_code == 404
    assert len(widget_rows(session, widget.id)) == rows_before


def test_bulk_create_over_1000_rows_is_422(
    client: TestClient, session: Session, dev_user: User
) -> None:
    widget = widget_with_rows(session, dev_user)
    rows_before = len(widget_rows(session, widget.id))

    response = client.post(bulk_url(widget), json={"rows": [{"data": ANN}] * 1001})

    assert response.status_code == 422
    assert len(widget_rows(session, widget.id)) == rows_before
