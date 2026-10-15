from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class WidgetType(StrEnum):
    FORM = "form"
    ADVICE = "advice"
    CHART = "chart"
    STAT = "stat"
    TABLE = "table"
    SCHEDULE = "schedule"


class TemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    default_portal_name: str


class PortalCreate(BaseModel):
    name: str = Field(min_length=1)
    template_id: str | None = None


class PortalUpdate(BaseModel):
    name: str = Field(min_length=1)


class PortalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    template_id: str | None
    created_at: datetime


class BoardCreate(BaseModel):
    label: str = Field(min_length=1)


class BoardUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1)
    position: int | None = None


class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    portal_id: int
    label: str
    position: int
    persona_id: str | None
    created_at: datetime


class WidgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    type: WidgetType
    x: int
    y: int
    w: int
    h: int
    config: dict[str, Any]
    created_at: datetime


class WidgetCreate(BaseModel):
    type: WidgetType
    x: int | None = Field(default=None, ge=0)
    y: int | None = Field(default=None, ge=0)
    w: int = Field(ge=1)
    h: int = Field(ge=1)
    config: dict[str, Any] = Field(default_factory=dict)


class WidgetUpdate(BaseModel):
    """Only the fields that were sent are changed. The type can't change: remove and add instead."""

    x: int | None = Field(default=None, ge=0)
    y: int | None = Field(default=None, ge=0)
    w: int | None = Field(default=None, ge=1)
    h: int | None = Field(default=None, ge=1)
    config: dict[str, Any] | None = None


class LayoutItem(BaseModel):
    """One widget's position and size, as sent after a drag or resize."""

    id: int
    x: int
    y: int
    w: int
    h: int
