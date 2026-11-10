from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board, Portal, User, WidgetInstance


def get_owned_portal(session: Session, user: User, portal_id: int) -> Portal:
    """Load a portal the user owns, or 404.
    Other users' portals also get 404, so they can't be discovered."""
    portal = session.get(Portal, portal_id)
    if portal is None or portal.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Portal not found")
    return portal


def get_owned_board(session: Session, user: User, board_id: int) -> Board:
    """Load a board whose portal the user owns, or 404 (also for other users' boards)."""
    board = session.scalar(
        select(Board).join(Portal).where(Board.id == board_id, Portal.owner_id == user.id)
    )
    if board is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Board not found")
    return board


def get_owned_widget(
    session: SessionDep, user: CurrentUserDep, board_id: int, widget_id: int
) -> WidgetInstance:
    board = get_owned_board(session, user, board_id)

    widget = session.scalar(
        select(WidgetInstance).where(
            WidgetInstance.id == widget_id, WidgetInstance.board_id == board.id
        )
    )
    if widget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Widget not found")
    return widget


def get_owned_widget_by_id(
    session: SessionDep, user: CurrentUserDep, widget_id: int
) -> WidgetInstance:
    widget = session.get(WidgetInstance, widget_id)
    if widget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Widget not found")
    get_owned_board(session, user, widget.board_id)
    return widget


OwnedWidgetDep = Annotated[WidgetInstance, Depends(get_owned_widget)]
OwnedWidgetByIdDep = Annotated[WidgetInstance, Depends(get_owned_widget_by_id)]
