from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, WidgetInstance


def bottom_of_board(session: Session, board: Board) -> int:
    lowest_edge = session.scalar(
        select(func.max(WidgetInstance.y + WidgetInstance.h)).where(
            WidgetInstance.board_id == board.id
        )
    )
    return lowest_edge or 0
