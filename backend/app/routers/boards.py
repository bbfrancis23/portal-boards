from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Board
from app.routers.portals import get_owned_portal
from app.schemas import BoardCreate, BoardRead, BoardUpdate

routerPortal = APIRouter(prefix="/api/portals/{portal_id}/boards", tags=["boards"])
routerBoard = APIRouter(prefix="/api/boards/{board_id}", tags=["boards"])


@routerPortal.get("")
def list_boards(session: SessionDep, user: CurrentUserDep, portal_id: int) -> list[BoardRead]:
    # 404 for someone else's portal, like every other route (not an empty list).
    portal = get_owned_portal(session, user, portal_id)
    statement = select(Board).where(Board.portal_id == portal.id).order_by(Board.position)
    return [BoardRead.model_validate(board) for board in session.scalars(statement)]


@routerPortal.post("", status_code=status.HTTP_201_CREATED)
def create_board(
    session: SessionDep, user: CurrentUserDep, data: BoardCreate, portal_id: int
) -> BoardRead:

    get_owned_portal(session, user, portal_id)
    highest = session.scalar(select(func.max(Board.position)).where(Board.portal_id == portal_id))
    position = 0 if highest is None else highest + 1

    board = Board(portal_id=portal_id, label=data.label, position=position)
    session.add(board)
    session.commit()
    session.refresh(board)
    return BoardRead.model_validate(board)


@routerBoard.patch("")
def update_board(
    board_id: int, data: BoardUpdate, session: SessionDep, user: CurrentUserDep
) -> BoardRead:
    board = session.get(Board, board_id)
    if board is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Board not found")
    get_owned_portal(session, user, board.portal_id)

    if data.label is not None:
        board.label = data.label
    if data.position is not None:
        board.position = data.position
    session.commit()
    session.refresh(board)
    return BoardRead.model_validate(board)


@routerBoard.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(board_id: int, session: SessionDep, user: CurrentUserDep) -> None:
    board = session.get(Board, board_id)
    if board is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Board not found")
    get_owned_portal(session, user, board.portal_id)
    session.delete(board)
    session.commit()
