from fastapi import APIRouter

from app.schemas import TemplateRead
from app.templates import TEMPLATES

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("")
def list_templates() -> list[TemplateRead]:
    return [TemplateRead.model_validate(template) for template in TEMPLATES.values()]
