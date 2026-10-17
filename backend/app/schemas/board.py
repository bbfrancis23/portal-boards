from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
