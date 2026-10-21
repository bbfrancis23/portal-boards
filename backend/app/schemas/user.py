from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str | None
    display_name: str
    avatar_url: str | None
    is_guest: bool
    default_portal_id: int | None
