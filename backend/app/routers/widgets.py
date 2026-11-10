from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board, WidgetInstance
from app.ownership import get_owned_board, get_owned_widget_by_id
from app.schemas import (
    CONFIG_SCHEMAS,
    DATA_WIDGET_TYPES,
    LayoutItem,
    WidgetCreate,
    WidgetRead,
    WidgetType,
    WidgetUpdate,
)
from app.services.widgets_service import bottom_of_board

router_board = APIRouter(prefix="/api/boards/{board_id}/widgets", tags=["widgets"])
router_widget = APIRouter(prefix="/api/widgets/{widget_id}", tags=["widgets"])


@router_board.get("")
def list_widgets(board_id: int, session: SessionDep, user: CurrentUserDep) -> list[WidgetRead]:
    board = get_owned_board(session, user, board_id)
    statement = (
        select(WidgetInstance)
        .where(WidgetInstance.board_id == board.id)
        .order_by(WidgetInstance.y, WidgetInstance.x)
    )
    return [WidgetRead.model_validate(widget) for widget in session.scalars(statement)]


def is_data_widget_in_portal(session: Session, widget_id: int, portal_id: int) -> bool:
    statement = (
        select(WidgetInstance.id)
        .join(Board)
        .where(
            WidgetInstance.id == widget_id,
            WidgetInstance.type.in_(DATA_WIDGET_TYPES),
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
    if source and not is_data_widget_in_portal(session, source["widget"], board.portal_id):
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


@router_board.post("", status_code=status.HTTP_201_CREATED)
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


@router_widget.patch("")
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


@router_widget.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(widget_id: int, session: SessionDep, user: CurrentUserDep) -> None:
    widget = get_owned_widget_by_id(session, user, widget_id)
    session.delete(widget)
    session.commit()


@router_board.patch("/layout")
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
