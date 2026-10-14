from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
