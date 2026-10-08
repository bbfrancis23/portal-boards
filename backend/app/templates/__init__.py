from app.templates.types import Template
from app.templates.wellness_studio import WELLNESS_STUDIO

TEMPLATES: dict[str, Template] = {template.id: template for template in [WELLNESS_STUDIO]}


def get_template(template_id: str) -> Template | None:
    return TEMPLATES.get(template_id)
