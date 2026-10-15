from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board, Portal, User, WidgetInstance
from app.schemas import LayoutItem, WidgetCreate, WidgetRead, WidgetUpdate

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


@routerBoard.post("", status_code=status.HTTP_201_CREATED)
def create_widget(
    board_id: int, session: SessionDep, user: CurrentUserDep, data: WidgetCreate
) -> WidgetRead:
    board = get_owned_board(session, user, board_id)
    highest = session.scalar(
        select(func.max(WidgetInstance.y + WidgetInstance.h)).where(
            WidgetInstance.board_id == board.id
        )
    )
    widget = WidgetInstance(
        board_id=board_id,
        type=data.type,
        x=data.x if data.x is not None else 0,
        y=data.y if data.y is not None else (highest or 0),
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
    get_owned_board(session, user, widget.board_id)
    if data.x is not None:
        widget.x = data.x
    if data.y is not None:
        widget.y = data.y
    if data.w is not None:
        widget.w = data.w
    if data.h is not None:
        widget.h = data.h
    if data.config is not None:
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
