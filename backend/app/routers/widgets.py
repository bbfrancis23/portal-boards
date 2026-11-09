import copy
from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board, Portal, User, WidgetInstance
from app.schemas import (
    LayoutItem,
    WidgetCreate,
    WidgetPresetRead,
    WidgetRead,
    WidgetType,
    WidgetUpdate,
)
from app.schemas.widget_config import CONFIG_SCHEMAS
from app.templates import get_template
from app.templates.types import Template, WidgetSpec

# Hidden from the presets until the schedule widget is built (#59).
UNBUILT_WIDGET_TYPES = {"schedule"}
# The widgets that hold rows; stats and charts read from them.
INPUT_WIDGET_TYPES = {"table", "schedule"}

routerBoard = APIRouter(prefix="/api/boards/{board_id}/widgets", tags=["widgets"])
routerWidget = APIRouter(prefix="/api/widgets/{widget_id}", tags=["widgets"])


def get_owned_board(session: Session, user: User, board_id: int) -> Board:
    """Load a board whose portal the user owns, or 404 (also for other users' boards)."""
    board = session.scalar(
        select(Board).join(Portal).where(Board.id == board_id, Portal.owner_id == user.id)
    )
    if board is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Board not found")
    return board


@routerBoard.get("")
def list_widgets(board_id: int, session: SessionDep, user: CurrentUserDep) -> list[WidgetRead]:
    board = get_owned_board(session, user, board_id)
    statement = (
        select(WidgetInstance)
        .where(WidgetInstance.board_id == board.id)
        .order_by(WidgetInstance.y, WidgetInstance.x)
    )
    return [WidgetRead.model_validate(widget) for widget in session.scalars(statement)]


def portal_template(session: Session, board: Board) -> Template | None:
    portal = session.get_one(Portal, board.portal_id)
    return get_template(portal.template_id) if portal.template_id else None


def find_template_widget(template: Template | None, key: str) -> WidgetSpec | None:
    if template is None:
        return None
    specs = (spec for board_spec in template.boards for spec in board_spec.widgets)
    return next((spec for spec in specs if spec.key == key), None)


def input_widget_ids(session: Session, board: Board) -> dict[str, int]:
    """The portal's tables and schedules (the widgets stats and charts read), by template key."""
    rows = session.execute(
        select(WidgetInstance.template_key, WidgetInstance.id)
        .join(Board)
        .where(
            Board.portal_id == board.portal_id,
            WidgetInstance.template_key.is_not(None),
            WidgetInstance.type.in_(INPUT_WIDGET_TYPES),
        )
    )
    return {key: widget_id for key, widget_id in rows if key is not None}


def missing_source_table(spec: WidgetSpec, widget_ids: dict[str, int]) -> bool:
    """A stat or chart would have nothing to read without its table."""
    source = spec.config.get("source")
    return source is not None and source["widget"] not in widget_ids


def is_table_in_portal(spec: WidgetSpec, widget_ids: dict[str, int]) -> bool:
    """A second copy of a table would split its rows between the two."""
    return spec.type == "table" and spec.key in widget_ids


def bottom_of_board(session: Session, board: Board) -> int:
    lowest_edge = session.scalar(
        select(func.max(WidgetInstance.y + WidgetInstance.h)).where(
            WidgetInstance.board_id == board.id
        )
    )
    return lowest_edge or 0


@routerBoard.get("/presets")
def list_widget_presets(
    board_id: int, session: SessionDep, user: CurrentUserDep
) -> list[WidgetPresetRead]:
    board = get_owned_board(session, user, board_id)
    template = portal_template(session, board)
    if template is None:
        return []

    widget_ids = input_widget_ids(session, board)
    presets: dict[str, WidgetPresetRead] = {}
    for board_spec in template.boards:
        for spec in board_spec.widgets:
            if spec.type in UNBUILT_WIDGET_TYPES or spec.key in presets:
                continue
            if missing_source_table(spec, widget_ids):
                continue
            presets[spec.key] = WidgetPresetRead(
                key=spec.key,
                type=WidgetType(spec.type),
                title=spec.config.get("title", spec.key),
                description=spec.description,
                table_in_portal=is_table_in_portal(spec, widget_ids),
            )
    return list(presets.values())


@routerBoard.post("/presets/{key}", status_code=status.HTTP_201_CREATED)
def add_widget_preset(
    board_id: int, key: str, session: SessionDep, user: CurrentUserDep
) -> WidgetRead:
    board = get_owned_board(session, user, board_id)
    spec = find_template_widget(portal_template(session, board), key)
    if spec is None or spec.type in UNBUILT_WIDGET_TYPES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Preset not found")

    widget_ids = input_widget_ids(session, board)
    if is_table_in_portal(spec, widget_ids):
        raise HTTPException(status.HTTP_409_CONFLICT, "This table is already in the portal")
    if missing_source_table(spec, widget_ids):
        raise HTTPException(status.HTTP_409_CONFLICT, "This widget's table isn't in the portal")

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


def is_input_widget_in_portal(session: Session, widget_id: int, portal_id: int) -> bool:
    statement = (
        select(WidgetInstance.id)
        .join(Board)
        .where(
            WidgetInstance.id == widget_id,
            WidgetInstance.type.in_(INPUT_WIDGET_TYPES),
            Board.portal_id == portal_id,
        )
    )
    return session.scalar(statement) is not None


def validate_config(
    session: Session, board: Board, widget_type: WidgetType, config: dict[str, Any]
) -> None:
    """Raises the same 422 FastAPI gives for a bad request body, pointing into the config."""
    try:
        CONFIG_SCHEMAS[widget_type].model_validate(config, strict=True)
    except ValidationError as error:
        raise RequestValidationError(
            [{**problem, "loc": ("body", "config", *problem["loc"])} for problem in error.errors()]
        ) from error

    source = config.get("source")
    if source and not is_input_widget_in_portal(session, source["widget"], board.portal_id):
        raise RequestValidationError(
            [
                {
                    "type": "source_widget",
                    "loc": ("body", "config", "source", "widget"),
                    "msg": "source.widget must be a table or schedule in this portal",
                    "input": source["widget"],
                }
            ]
        )


@routerBoard.post("", status_code=status.HTTP_201_CREATED)
def create_widget(
    board_id: int, session: SessionDep, user: CurrentUserDep, data: WidgetCreate
) -> WidgetRead:
    board = get_owned_board(session, user, board_id)
    validate_config(session, board, data.type, data.config)
    widget = WidgetInstance(
        board_id=board_id,
        type=data.type,
        x=data.x if data.x is not None else 0,
        y=data.y if data.y is not None else bottom_of_board(session, board),
        w=data.w,
        h=data.h,
        config=data.config,
    )
    session.add(widget)
    session.commit()
    session.refresh(widget)

    return WidgetRead.model_validate(widget)


@routerWidget.patch("")
def update_widget(
    widget_id: int, data: WidgetUpdate, session: SessionDep, user: CurrentUserDep
) -> WidgetRead:
    widget = session.get(WidgetInstance, widget_id)
    if widget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Widget not found")
    board = get_owned_board(session, user, widget.board_id)
    if data.x is not None:
        widget.x = data.x
    if data.y is not None:
        widget.y = data.y
    if data.w is not None:
        widget.w = data.w
    if data.h is not None:
        widget.h = data.h
    if data.config is not None:
        validate_config(session, board, WidgetType(widget.type), data.config)
        widget.config = data.config
    session.commit()
    session.refresh(widget)
    return WidgetRead.model_validate(widget)


@routerWidget.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(widget_id: int, session: SessionDep, user: CurrentUserDep) -> None:
    widget = session.get(WidgetInstance, widget_id)
    if widget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Widget not found")
    get_owned_board(session, user, widget.board_id)
    session.delete(widget)
    session.commit()


@routerBoard.patch("/layout")
def update_layout(
    board_id: int, data: list[LayoutItem], session: SessionDep, user: CurrentUserDep
) -> list[WidgetRead]:
    board = get_owned_board(session, user, board_id)
    statement = select(WidgetInstance).where(WidgetInstance.board_id == board.id)
    widgets = {widget.id: widget for widget in session.scalars(statement)}

    unknown = [item.id for item in data if item.id not in widgets]
    if unknown:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Widgets not on this board : {unknown}")

    for item in data:
        widget = widgets[item.id]
        widget.x = item.x
        widget.y = item.y
        widget.w = item.w
        widget.h = item.h
    session.commit()

    ordered = sorted(widgets.values(), key=lambda widget: (widget.y, widget.x))
    return [WidgetRead.model_validate(widget) for widget in ordered]
