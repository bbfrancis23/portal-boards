from datetime import date

import pytest
from sqlmodel import Session, func, select

from app.models import Board, Portal, User, WidgetData, WidgetInstance
from app.services.portals import create_portal
from app.templates import TEMPLATES
from app.templates.types import Template
from app.templates.wellness_studio import generate_sample_data

TODAY = date(2026, 10, 7)
INPUT_WIDGET_TYPES = {"table", "schedule"}


def portal_widgets(session: Session, portal: Portal) -> list[WidgetInstance]:
    statement = select(WidgetInstance).join(Board).where(Board.portal_id == portal.id)
    return list(session.exec(statement).all())


def test_blank_portal_has_no_boards(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Blank")

    assert portal.template is None
    assert session.exec(select(Board).where(Board.portal_id == portal.id)).all() == []


def test_template_copies_boards_and_widgets(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Atrium", "wellness-studio", today=TODAY)

    boards = session.exec(
        select(Board).where(Board.portal_id == portal.id).order_by(Board.position)
    ).all()
    assert [board.label for board in boards] == ["Overview", "Schedule", "Members", "Revenue"]
    assert [board.persona_id for board in boards] == [
        None,
        "secretary",
        "yoga-instructor",
        "accountant",
    ]
    assert len(portal_widgets(session, portal)) == 12
    assert session.exec(select(func.count()).select_from(WidgetData)).one() == 0


def test_sources_point_at_widgets_in_the_same_portal(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Atrium", "wellness-studio", today=TODAY)

    widgets = portal_widgets(session, portal)
    widget_ids = {widget.id for widget in widgets}
    sources = [widget.config["source"] for widget in widgets if "source" in widget.config]
    assert sources
    for source in sources:
        assert source["widget"] in widget_ids


def test_sample_data_is_copied_when_requested(session: Session, user: User) -> None:
    create_portal(session, user.id, "Atrium", "wellness-studio", with_sample_data=True, today=TODAY)

    expected = sum(len(rows) for rows in generate_sample_data(TODAY).values())
    assert session.exec(select(func.count()).select_from(WidgetData)).one() == expected


def test_portals_from_the_same_template_are_independent(session: Session, user: User) -> None:
    first = create_portal(session, user.id, "First", "wellness-studio", today=TODAY)
    second = create_portal(session, user.id, "Second", "wellness-studio", today=TODAY)

    first_ids = {widget.id for widget in portal_widgets(session, first)}
    second_ids = {widget.id for widget in portal_widgets(session, second)}
    assert first_ids.isdisjoint(second_ids)

    session.delete(first)
    session.commit()
    assert portal_widgets(session, first) == []
    assert len(portal_widgets(session, second)) == 12


def test_unknown_template_is_rejected(session: Session, user: User) -> None:
    with pytest.raises(ValueError):
        create_portal(session, user.id, "Nope", "no-such-template")

    assert session.exec(select(Portal)).all() == []


@pytest.mark.parametrize("template", TEMPLATES.values(), ids=lambda template: template.id)
def test_template_queries_use_real_widgets_and_fields(template: Template) -> None:
    specs = [spec for board in template.boards for spec in board.widgets]
    by_key = {spec.key: spec for spec in specs}
    assert len(by_key) == len(specs), "widget keys must be unique across the template"

    sample = template.sample_data(TODAY)
    for spec in specs:
        source = spec.config.get("source")
        if source is None:
            continue
        target = by_key.get(source["widget"])
        assert target is not None, f"{spec.key}: unknown widget {source['widget']!r}"
        assert target.type in INPUT_WIDGET_TYPES, f"{spec.key}: source is not an input widget"

        fields = {field for row in sample[target.key] for field in row}
        used = {source.get(name) for name in ("field", "groupBy", "seriesBy", "dateField")}
        used = (used - {None}) | set(source.get("where", {}))
        assert used <= fields, f"{spec.key}: unknown fields {used - fields}"
