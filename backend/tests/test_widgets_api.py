from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Board, User, WidgetData, WidgetInstance
from app.services.portals_service import create_portal


def test_list_widgets_in_reading_order(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]

    response = client.get(f"/api/boards/{overview['id']}/widgets")

    assert response.status_code == 200
    positions = [(widget["y"], widget["x"]) for widget in response.json()]
    assert positions == sorted(positions)
    assert [widget["type"] for widget in response.json()] == [
        "stat",
        "stat",
        "stat",
        "stat",
        "chart",
    ]


def test_create_widget_without_position_goes_below(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    widgets = client.get(f"/api/boards/{overview['id']}/widgets").json()
    bottom = max(widget["y"] + widget["h"] for widget in widgets)

    response = client.post(
        f"/api/boards/{overview['id']}/widgets", json={"type": "stat", "w": 3, "h": 2}
    )

    assert response.status_code == 201
    widget = response.json()
    assert (widget["x"], widget["y"]) == (0, bottom)


def test_create_with_an_unknown_type_is_422(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]

    response = client.post(
        f"/api/boards/{overview['id']}/widgets", json={"type": "chrat", "w": 3, "h": 2}
    )
    assert response.status_code == 422


def test_update_widget_config_is_saved(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    widget = client.get(f"/api/boards/{overview['id']}/widgets").json()[0]
    config = {"title": "Members today", "source": "members"}

    response = client.patch(f"/api/widgets/{widget['id']}", json={"config": config})

    assert response.status_code == 200
    assert response.json()["config"] == config
    reloaded = client.get(f"/api/boards/{overview['id']}/widgets").json()
    assert next(w for w in reloaded if w["id"] == widget["id"])["config"] == config


def test_update_changes_only_what_was_sent(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    widget = client.get(f"/api/boards/{overview['id']}/widgets").json()[0]
    w = 42

    response = client.patch(f"/api/widgets/{widget['id']}", json={"w": w})

    assert response.status_code == 200
    updated = response.json()
    assert updated["w"] == w
    assert updated["x"] == widget["x"]
    assert updated["y"] == widget["y"]
    assert updated["h"] == widget["h"]
    assert updated["config"] == widget["config"]


def test_layout_moves_widgets(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview = client.get(f"/api/portals/{portal_id}/boards").json()[0]
    first, second = client.get(f"/api/boards/{overview['id']}/widgets").json()[:2]
    layout = [
        {"id": first["id"], "x": second["x"], "y": second["y"], "w": first["w"], "h": first["h"]},
        {"id": second["id"], "x": first["x"], "y": first["y"], "w": second["w"], "h": second["h"]},
    ]

    response = client.patch(f"/api/boards/{overview['id']}/widgets/layout", json=layout)

    assert response.status_code == 200
    assert [w["id"] for w in response.json()[:2]] == [second["id"], first["id"]]
    reloaded = client.get(f"/api/boards/{overview['id']}/widgets").json()
    assert [w["id"] for w in reloaded[:2]] == [second["id"], first["id"]]


def test_layout_rejects_a_widget_from_another_board(client: TestClient) -> None:
    portal_id = client.post(
        "/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"}
    ).json()["id"]
    overview, schedule = client.get(f"/api/portals/{portal_id}/boards").json()[:2]
    mine = client.get(f"/api/boards/{overview['id']}/widgets").json()[0]
    stranger = client.get(f"/api/boards/{schedule['id']}/widgets").json()[0]
    layout = [
        {"id": mine["id"], "x": 6, "y": 6, "w": mine["w"], "h": mine["h"]},
        {"id": stranger["id"], "x": 0, "y": 0, "w": stranger["w"], "h": stranger["h"]},
    ]

    response = client.patch(f"/api/boards/{overview['id']}/widgets/layout", json=layout)

    assert response.status_code == 404
    reloaded = client.get(f"/api/boards/{overview['id']}/widgets").json()
    assert reloaded[0] == mine


def test_delete_removes_the_widget_and_its_data(
    client: TestClient, session: Session, dev_user: User
) -> None:
    create_portal(session, dev_user.id, "Atrium", "wellness-studio", with_sample_data=True)
    row = session.scalars(select(WidgetData)).first()
    assert row is not None
    widget = session.get(WidgetInstance, row.widget_instance_id)
    assert widget is not None
    board_id, widget_id = widget.board_id, widget.id

    response = client.delete(f"/api/widgets/{widget_id}")

    assert response.status_code == 204
    ids = [w["id"] for w in client.get(f"/api/boards/{board_id}/widgets").json()]
    assert widget_id not in ids
    statement = select(WidgetData).where(WidgetData.widget_instance_id == widget_id)
    assert session.scalars(statement).first() is None


def test_missing_board_or_widget_is_404(client: TestClient) -> None:
    body = {"type": "stat", "w": 3, "h": 2}
    assert client.get("/api/boards/999/widgets").status_code == 404
    assert client.post("/api/boards/999/widgets", json=body).status_code == 404
    assert client.patch("/api/boards/999/widgets/layout", json=[]).status_code == 404
    assert client.patch("/api/widgets/999", json={"w": 4}).status_code == 404
    assert client.delete("/api/widgets/999").status_code == 404


def test_other_users_widgets_are_protected(
    client: TestClient, session: Session, other_user: User
) -> None:
    theirs = create_portal(session, other_user.id, "Theirs", "wellness-studio")
    their_board = session.scalar(select(Board).where(Board.portal_id == theirs.id))
    assert their_board is not None
    their_widget = session.scalar(
        select(WidgetInstance).where(WidgetInstance.board_id == their_board.id)
    )
    assert their_widget is not None
    before = (their_widget.x, their_widget.y, their_widget.w, their_widget.h)
    body = {"type": "stat", "w": 3, "h": 2}
    layout = [{"id": their_widget.id, "x": 9, "y": 9, "w": 1, "h": 1}]

    assert client.get(f"/api/boards/{their_board.id}/widgets").status_code == 404
    assert client.post(f"/api/boards/{their_board.id}/widgets", json=body).status_code == 404
    url = f"/api/boards/{their_board.id}/widgets/layout"
    assert client.patch(url, json=layout).status_code == 404
    assert client.patch(f"/api/widgets/{their_widget.id}", json={"w": 9}).status_code == 404
    assert client.delete(f"/api/widgets/{their_widget.id}").status_code == 404
    session.refresh(their_widget)
    assert (their_widget.x, their_widget.y, their_widget.w, their_widget.h) == before


def overview_board_id(client: TestClient) -> int:
    portal = client.post("/api/portals", json={"name": "Atrium", "template_id": "wellness-studio"})
    return client.get(f"/api/portals/{portal.json()['id']}/boards").json()[0]["id"]


def test_presets_list_the_templates_widgets(client: TestClient) -> None:
    response = client.get(f"/api/boards/{overview_board_id(client)}/widgets/presets")

    assert response.status_code == 200
    presets = {preset["key"]: preset for preset in response.json()}
    assert presets["active_members"] == {
        "key": "active_members",
        "type": "stat",
        "title": "Active members",
        "description": "How many members are active right now.",
        "table_in_portal": False,
    }
    assert "schedule" not in presets


def test_tables_already_in_the_portal_are_marked_added(client: TestClient) -> None:
    presets = client.get(f"/api/boards/{overview_board_id(client)}/widgets/presets").json()

    tables = [preset for preset in presets if preset["type"] == "table"]
    assert tables
    assert all(table["table_in_portal"] for table in tables)


def test_a_deleted_table_can_be_added_again(client: TestClient, session: Session) -> None:
    board_id = overview_board_id(client)
    sales = session.scalar(select(WidgetInstance).where(WidgetInstance.template_key == "sales"))
    assert sales is not None
    client.delete(f"/api/widgets/{sales.id}")

    presets = client.get(f"/api/boards/{board_id}/widgets/presets").json()

    sales_preset = next(preset for preset in presets if preset["key"] == "sales")
    assert sales_preset["table_in_portal"] is False


def test_stats_and_charts_need_their_table(client: TestClient, session: Session) -> None:
    board_id = overview_board_id(client)
    sales = session.scalar(select(WidgetInstance).where(WidgetInstance.template_key == "sales"))
    assert sales is not None
    client.delete(f"/api/widgets/{sales.id}")

    presets = client.get(f"/api/boards/{board_id}/widgets/presets").json()
    keys = {preset["key"] for preset in presets}

    assert "revenue_this_month" not in keys
    assert "revenue_by_month" not in keys
    assert "active_members" in keys


def test_a_blank_portal_has_no_presets(client: TestClient) -> None:
    portal_id = client.post("/api/portals", json={"name": "Blank"}).json()["id"]
    board_id = client.post(f"/api/portals/{portal_id}/boards", json={"label": "Main"}).json()["id"]

    response = client.get(f"/api/boards/{board_id}/widgets/presets")

    assert response.status_code == 200
    assert response.json() == []


def test_other_users_presets_are_404(
    client: TestClient, session: Session, other_user: User
) -> None:
    theirs = create_portal(session, other_user.id, "Theirs", "wellness-studio")
    their_board = session.scalar(select(Board).where(Board.portal_id == theirs.id))
    assert their_board is not None

    assert client.get(f"/api/boards/{their_board.id}/widgets/presets").status_code == 404
    url = f"/api/boards/{their_board.id}/widgets/presets/active_members"
    assert client.post(url).status_code == 404


def widget_with_key(session: Session, key: str) -> WidgetInstance:
    widget = session.scalar(select(WidgetInstance).where(WidgetInstance.template_key == key))
    assert widget is not None
    return widget


def test_add_a_stat_preset_reads_the_portals_own_table(
    client: TestClient, session: Session
) -> None:
    board_id = overview_board_id(client)
    widgets = client.get(f"/api/boards/{board_id}/widgets").json()
    bottom = max(widget["y"] + widget["h"] for widget in widgets)

    response = client.post(f"/api/boards/{board_id}/widgets/presets/active_members")

    assert response.status_code == 201
    widget = response.json()
    assert widget["type"] == "stat"
    assert (widget["x"], widget["y"]) == (0, bottom)
    assert widget["config"]["title"] == "Active members"
    assert widget["config"]["source"]["widget"] == widget_with_key(session, "members").id


def test_a_stat_preset_can_be_added_twice(client: TestClient) -> None:
    url = f"/api/boards/{overview_board_id(client)}/widgets/presets/active_members"

    assert client.post(url).status_code == 201
    assert client.post(url).status_code == 201


def test_adding_a_table_already_in_the_portal_is_409(client: TestClient) -> None:
    url = f"/api/boards/{overview_board_id(client)}/widgets/presets/sales"

    assert client.post(url).status_code == 409


def test_a_deleted_table_is_added_back(client: TestClient, session: Session) -> None:
    board_id = overview_board_id(client)
    client.delete(f"/api/widgets/{widget_with_key(session, 'sales').id}")

    response = client.post(f"/api/boards/{board_id}/widgets/presets/sales")

    assert response.status_code == 201
    assert response.json()["type"] == "table"


def test_adding_a_stat_without_its_table_is_409(client: TestClient, session: Session) -> None:
    board_id = overview_board_id(client)
    client.delete(f"/api/widgets/{widget_with_key(session, 'sales').id}")

    response = client.post(f"/api/boards/{board_id}/widgets/presets/revenue_this_month")

    assert response.status_code == 409


def test_unknown_or_hidden_presets_are_404(client: TestClient) -> None:
    board_id = overview_board_id(client)

    assert client.post(f"/api/boards/{board_id}/widgets/presets/imaginary").status_code == 404
    assert client.post(f"/api/boards/{board_id}/widgets/presets/schedule").status_code == 404
