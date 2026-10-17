from pydantic import BaseModel, ConfigDict


class TemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    default_portal_name: str
