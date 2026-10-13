"""rename portal template to template_id

Revision ID: cec62200ab61
Revises: 25f7e69101ae
Create Date: 2026-10-13 10:02:26.449387

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cec62200ab61"
down_revision: str | Sequence[str] | None = "25f7e69101ae"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Hand-written rename: autogenerate proposes add + drop, which would lose existing values.
    with op.batch_alter_table("portals", schema=None) as batch_op:
        batch_op.alter_column("template", new_column_name="template_id")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("portals", schema=None) as batch_op:
        batch_op.alter_column("template_id", new_column_name="template")
