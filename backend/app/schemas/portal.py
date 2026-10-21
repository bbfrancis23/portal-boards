from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PortalCreate(BaseModel):
    name: str = Field(min_length=1)
    template_id: str | None = None


class PortalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    template_id: str | None
    created_at: datetime


class PortalUpdate(BaseModel):
    name: str = Field(min_length=1)


class DefaultPortalUpdate(BaseModel):
    default_portal_id: int = Field(ge=1)
