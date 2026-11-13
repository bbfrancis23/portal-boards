import copy
from datetime import date

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, Portal, User, WidgetData, WidgetInstance
from app.schemas.widget import DATA_WIDGET_TYPES, WidgetType
from app.schemas.widget_config import CONFIG_SCHEMAS
from app.services.portals_service import create_portal
from app.templates import TEMPLATES
from app.templates.types import Template
from app.templates.wellness_studio import generate_sample_data

TODAY = date(2026, 10, 7)
# Templates name their source widget by key; a real portal swaps in the widget's id.
STAND_IN_WIDGET_ID = 1


def portal_widgets(session: Session, portal: Portal) -> list[WidgetInstance]:
    statement = select(WidgetInstance).join(Board).where(Board.portal_id == portal.id)
    return list(session.scalars(statement).all())


def test_blank_portal_has_no_boards(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Blank")

    assert portal.template_id is None
    assert session.scalars(select(Board).where(Board.portal_id == portal.id)).all() == []


def test_template_copies_boards_and_widgets(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Atrium", template_id="wellness-studio", today=TODAY)

    boards = session.scalars(
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
    assert session.scalar(select(func.count()).select_from(WidgetData)) == 0


def test_sources_point_at_widgets_in_the_same_portal(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Atrium", template_id="wellness-studio", today=TODAY)

    widgets = portal_widgets(session, portal)
    widget_ids = {widget.id for widget in widgets}
    sources = [widget.config["source"] for widget in widgets if "source" in widget.config]
    assert sources
    for source in sources:
        assert source["widget"] in widget_ids


def test_sample_data_is_copied_when_requested(session: Session, user: User) -> None:
    create_portal(
        session,
        user.id,
        "Atrium",
        template_id="wellness-studio",
        with_sample_data=True,
        today=TODAY,
    )

    expected = sum(len(rows) for rows in generate_sample_data(TODAY).values())
    assert session.scalar(select(func.count()).select_from(WidgetData)) == expected


def test_portals_from_the_same_template_are_independent(session: Session, user: User) -> None:
    first = create_portal(session, user.id, "First", template_id="wellness-studio", today=TODAY)
    second = create_portal(session, user.id, "Second", template_id="wellness-studio", today=TODAY)

    first_ids = {widget.id for widget in portal_widgets(session, first)}
    second_ids = {widget.id for widget in portal_widgets(session, second)}
    assert first_ids.isdisjoint(second_ids)

    session.delete(first)
    session.commit()
    assert portal_widgets(session, first) == []
    assert len(portal_widgets(session, second)) == 12


def test_unknown_template_is_rejected(session: Session, user: User) -> None:
    with pytest.raises(ValueError):
        create_portal(session, user.id, "Nope", template_id="no-such-template")

    assert session.scalars(select(Portal)).all() == []


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
        assert target.type in DATA_WIDGET_TYPES, f"{spec.key}: source is not a data widget"

        fields = {field for row in sample[target.key] for field in row}
        used = {source.get(name) for name in ("field", "groupBy", "seriesBy", "dateField")}
        used = (used - {None}) | set(source.get("where", {}))
        assert used <= fields, f"{spec.key}: unknown fields {used - fields}"


@pytest.mark.parametrize("template", TEMPLATES.values(), ids=lambda template: template.id)
def test_every_template_widget_config_matches_its_schema(template: Template) -> None:
    for spec in (spec for board in template.boards for spec in board.widgets):
        config = copy.deepcopy(spec.config)
        if "source" in config:
            config["source"]["widget"] = STAND_IN_WIDGET_ID

        try:
            CONFIG_SCHEMAS[WidgetType(spec.type)].model_validate(config, strict=True)
        except ValidationError as error:
            pytest.fail(f"{spec.key}: {error}")


@pytest.mark.parametrize("template", TEMPLATES.values(), ids=lambda template: template.id)
def test_sample_rows_fill_every_required_column(template: Template) -> None:
    sample = template.sample_data(TODAY)
    for spec in (spec for board in template.boards for spec in board.widgets):
        required = [col["key"] for col in spec.config.get("columns", []) if col.get("required")]
        for row in sample.get(spec.key, []):
            missing = [key for key in required if row.get(key) in (None, "")]
            assert not missing, f"{spec.key}: a sample row has no {missing}"


def test_template_widgets_keep_their_template_key(session: Session, user: User) -> None:
    portal = create_portal(session, user.id, "Atrium", template_id="wellness-studio", today=TODAY)

    template = TEMPLATES["wellness-studio"]
    template_keys = [spec.key for board in template.boards for spec in board.widgets]
    widget_keys = [widget.template_key for widget in portal_widgets(session, portal)]
    assert sorted(widget_keys) == sorted(template_keys)
