import copy
from datetime import date

from sqlmodel import Session

from app.models import Board, Portal, WidgetData, WidgetInstance
from app.templates import get_template
from app.templates.types import WidgetSpec


def create_portal(
    session: Session,
    owner_id: int,
    name: str,
    template_id: str | None = None,
    with_sample_data: bool = False,
    today: date | None = None,
) -> Portal:
    """Create a portal, copying the template's boards, widgets and (optionally) sample data."""
    template = None
    if template_id is not None:
        template = get_template(template_id)
        if template is None:
            raise ValueError(f"Unknown template: {template_id}")

    portal = Portal(owner_id=owner_id, name=name, template=template_id)
    session.add(portal)
    session.flush()

    if template is not None:
        created: list[tuple[WidgetSpec, WidgetInstance]] = []
        for position, board_spec in enumerate(template.boards):
            board = Board(
                portal_id=portal.id,
                label=board_spec.label,
                position=position,
                persona_id=board_spec.persona_id,
            )
            session.add(board)
            session.flush()
            for spec in board_spec.widgets:
                widget = WidgetInstance(
                    board_id=board.id,
                    type=spec.type,
                    x=spec.x,
                    y=spec.y,
                    w=spec.w,
                    h=spec.h,
                    config=copy.deepcopy(spec.config),
                )
                session.add(widget)
                created.append((spec, widget))
        session.flush()

        # Swap template widget keys in each query's "source" for the real widget ids.
        widget_ids = {spec.key: widget.id for spec, widget in created}
        for _spec, widget in created:
            source = widget.config.get("source")
            if source is not None:
                widget.config = {
                    **widget.config,
                    "source": {**source, "widget": widget_ids[source["widget"]]},
                }

        if with_sample_data:
            sample = template.sample_data(today or date.today())
            for key, rows in sample.items():
                session.add_all(
                    WidgetData(widget_instance_id=widget_ids[key], data=row) for row in rows
                )

    session.commit()
    session.refresh(portal)
    return portal
