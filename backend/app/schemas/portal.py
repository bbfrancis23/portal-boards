from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PortalCreate(BaseModel):
    # Spaces-only text counts as empty: no blank names, and a blank description
    # falls back to the template's.
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=200)
    template_id: str | None = None


class PortalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    template_id: str | None
    created_at: datetime


class PortalUpdate(BaseModel):
    # Spaces-only text counts as empty: no blank names, and a blank description
    # falls back to the template's.
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=200)


class DefaultPortalUpdate(BaseModel):
    default_portal_id: int = Field(ge=1)
