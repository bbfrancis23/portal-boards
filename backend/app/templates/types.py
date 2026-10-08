from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date
from typing import Any

# Rows of sample data for each widget, keyed by the widget's template key
SampleData = dict[str, list[dict[str, Any]]]


@dataclass(frozen=True)
class WidgetSpec:
    """Describes a single widget on a template board (its type, position and config)."""

    key: str
    type: str
    x: int
    y: int
    w: int
    h: int
    config: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BoardSpec:
    """Describes a single board and the list of widgets on it."""

    label: str
    widgets: list[WidgetSpec]
    persona_id: str | None = None


@dataclass(frozen=True)
class Template:
    """A bundle for one business type (boards, widgets and sample data),
    copied into a new portal."""

    id: str
    name: str
    description: str
    default_portal_name: str
    persona_id: str
    boards: list[BoardSpec]
    sample_data: Callable[[date], SampleData]
