from fastapi import APIRouter, HTTPException, status
from fastapi.exceptions import RequestValidationError
from sqlalchemy import select

from app.db import SessionDep
from app.models import WidgetData, WidgetInstance
from app.ownership import OwnedWidgetByIdDep, OwnedWidgetDep
from app.schemas.widget import DATA_WIDGET_TYPES, WidgetDataCreate, WidgetDataRead

router_board = APIRouter(
    prefix="/api/boards/{board_id}/widgets/{widget_id}/data", tags=["widget data"]
)
# By widget id alone: a stat or chart reads a table that may sit on another board.
router_widget = APIRouter(prefix="/api/widgets/{widget_id}/data", tags=["widget data"])


def get_widget_row(session: SessionDep, widget: WidgetInstance, row_id: int) -> WidgetData:
    # Matching the widget too stops a row from being edited or deleted through a widget it isn't in.
    widget_data = session.scalar(
        select(WidgetData).where(
            WidgetData.id == row_id, WidgetData.widget_instance_id == widget.id
        )
    )
    if widget_data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Row not found")
    return widget_data


def rows_in_id_order(session: SessionDep, widget: WidgetInstance) -> list[WidgetDataRead]:
    statement = (
        select(WidgetData).where(WidgetData.widget_instance_id == widget.id).order_by(WidgetData.id)
    )
    return [
        WidgetDataRead.model_validate(widget_data) for widget_data in session.scalars(statement)
    ]


@router_board.get("")
def list_widget_data(widget: OwnedWidgetDep, session: SessionDep) -> list[WidgetDataRead]:
    return rows_in_id_order(session, widget)


@router_widget.get("")
def list_widget_data_by_widget_id(
    widget: OwnedWidgetByIdDep, session: SessionDep
) -> list[WidgetDataRead]:
    return rows_in_id_order(session, widget)


def is_blank(value: object) -> bool:
    return value is None or value == ""


def require_columns(widget: WidgetInstance, data: dict[str, object]) -> None:
    """A 422 like FastAPI's own, one error per required column left empty."""
    missing = [
        column
        for column in widget.config.get("columns", [])
        if column.get("required") and is_blank(data.get(column["key"]))
    ]
    if missing:
        raise RequestValidationError(
            [
                {
                    "type": "missing",
                    "loc": ("body", "data", column["key"]),
                    "msg": f"{column['label']} is required",
                    "input": data.get(column["key"]),
                }
                for column in missing
            ]
        )


@router_board.post("", status_code=status.HTTP_201_CREATED)
def create_widget_data(
    widget: OwnedWidgetDep, session: SessionDep, body: WidgetDataCreate
) -> WidgetDataRead:
    if widget.type not in DATA_WIDGET_TYPES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, f"A {widget.type} widget doesn't store rows"
        )

    require_columns(widget, body.data)
    widget_data = WidgetData(widget_instance_id=widget.id, data=body.data)
    session.add(widget_data)
    session.commit()
    session.refresh(widget_data)
    return WidgetDataRead.model_validate(widget_data)


@router_widget.patch("/{row_id}")
def update_widget_data(
    row_id: int, widget: OwnedWidgetByIdDep, session: SessionDep, body: WidgetDataCreate
) -> WidgetDataRead:
    widget_data = get_widget_row(session, widget, row_id)
    require_columns(widget, body.data)
    widget_data.data = body.data
    session.commit()
    session.refresh(widget_data)
    return WidgetDataRead.model_validate(widget_data)


@router_widget.delete("/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget_data(row_id: int, widget: OwnedWidgetByIdDep, session: SessionDep) -> None:
    widget_data = get_widget_row(session, widget, row_id)
    session.delete(widget_data)
    session.commit()
