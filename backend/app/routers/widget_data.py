from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import WidgetData, WidgetInstance
from app.routers.widgets import get_owned_board
from app.schemas.widget import WidgetDataCreate, WidgetDataRead, WidgetType

# Only these widgets keep their own rows. Charts and stats get their numbers from them.
INPUT_TYPES = {WidgetType.TABLE, WidgetType.SCHEDULE, WidgetType.FORM}

router = APIRouter(prefix="/api/boards/{board_id}/widgets/{widget_id}/data", tags=["widget data"])


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


OwnedWidgetDep = Annotated[WidgetInstance, Depends(get_owned_widget)]


@router.get("")
def list_widget_data(widget: OwnedWidgetDep, session: SessionDep) -> list[WidgetDataRead]:
    statement = (
        select(WidgetData).where(WidgetData.widget_instance_id == widget.id).order_by(WidgetData.id)
    )
    return [
        WidgetDataRead.model_validate(widget_data) for widget_data in session.scalars(statement)
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_widget_data(
    widget: OwnedWidgetDep, session: SessionDep, body: WidgetDataCreate
) -> WidgetDataRead:
    if widget.type not in INPUT_TYPES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, f"A {widget.type} widget doesn't store rows"
        )
    widget_data = WidgetData(widget_instance_id=widget.id, data=body.data)
    session.add(widget_data)
    session.commit()
    session.refresh(widget_data)
    return WidgetDataRead.model_validate(widget_data)
