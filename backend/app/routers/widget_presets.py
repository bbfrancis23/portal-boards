import copy

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board, Portal, WidgetInstance
from app.ownership import get_owned_board
from app.schemas import DATA_WIDGET_TYPES, WidgetPresetRead, WidgetRead, WidgetType
from app.services.widgets_service import bottom_of_board
from app.templates import get_template
from app.templates.types import Template, WidgetSpec

router_board = APIRouter(prefix="/api/boards/{board_id}/widgets/presets", tags=["widget presets"])


def portal_template(session: Session, board: Board) -> Template | None:
    portal = session.get_one(Portal, board.portal_id)
    return get_template(portal.template_id) if portal.template_id else None


def find_template_widget(template: Template | None, key: str) -> WidgetSpec | None:
    if template is None:
        return None
    specs = (spec for board_spec in template.boards for spec in board_spec.widgets)
    return next((spec for spec in specs if spec.key == key), None)


def data_widget_ids(session: Session, board: Board) -> dict[str, int]:
    """The portal's tables and schedules (the widgets stats and charts read), by template key."""
    rows = session.execute(
        select(WidgetInstance.template_key, WidgetInstance.id)
        .join(Board)
        .where(
            Board.portal_id == board.portal_id,
            WidgetInstance.template_key.is_not(None),
            WidgetInstance.type.in_(DATA_WIDGET_TYPES),
        )
    )
    return {key: widget_id for key, widget_id in rows if key is not None}


def missing_data_widget(spec: WidgetSpec, widget_ids: dict[str, int]) -> bool:
    """A stat or chart would have nothing to read without its table or schedule."""
    source = spec.config.get("source")
    return source is not None and source["widget"] not in widget_ids


def is_data_widget_already_in_portal(spec: WidgetSpec, widget_ids: dict[str, int]) -> bool:
    """A second copy of a table or schedule would split its rows between the two."""
    return spec.type in DATA_WIDGET_TYPES and spec.key in widget_ids


@router_board.get("")
def list_widget_presets(
    board_id: int, session: SessionDep, user: CurrentUserDep
) -> list[WidgetPresetRead]:
    board = get_owned_board(session, user, board_id)
    template = portal_template(session, board)
    if template is None:
        return []

    widget_ids = data_widget_ids(session, board)
    presets: dict[str, WidgetPresetRead] = {}
    for board_spec in template.boards:
        for spec in board_spec.widgets:
            if spec.key in presets or missing_data_widget(spec, widget_ids):
                continue
            presets[spec.key] = WidgetPresetRead(
                key=spec.key,
                type=WidgetType(spec.type),
                title=spec.config.get("title", spec.key),
                description=spec.description,
                data_widget_in_portal=is_data_widget_already_in_portal(spec, widget_ids),
            )
    return list(presets.values())


@router_board.post("/{key}", status_code=status.HTTP_201_CREATED)
def add_widget_preset(
    board_id: int, key: str, session: SessionDep, user: CurrentUserDep
) -> WidgetRead:
    board = get_owned_board(session, user, board_id)
    spec = find_template_widget(portal_template(session, board), key)
    if spec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Preset not found")

    widget_ids = data_widget_ids(session, board)
    if is_data_widget_already_in_portal(spec, widget_ids):
        raise HTTPException(status.HTTP_409_CONFLICT, f"This {spec.type} is already in the portal")
    if missing_data_widget(spec, widget_ids):
        raise HTTPException(status.HTTP_409_CONFLICT, "This widget's data isn't in the portal")

    config = copy.deepcopy(spec.config)
    source = config.get("source")
    if source is not None:
        source["widget"] = widget_ids[source["widget"]]

    widget = WidgetInstance(
        board_id=board.id,
        type=spec.type,
        x=0,
        y=bottom_of_board(session, board),
        w=spec.w,
        h=spec.h,
        config=config,
        template_key=spec.key,
    )
    session.add(widget)
    session.commit()
    session.refresh(widget)
    return WidgetRead.model_validate(widget)
