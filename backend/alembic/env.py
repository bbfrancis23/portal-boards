from logging.config import fileConfig

from alembic import context
from app.config import get_settings
from app.db import create_db_engine
from app.models import SQLModel

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importing from app.models registers every table on SQLModel.metadata.
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Write the migration SQL to the terminal instead of running it."""
    context.configure(
        url=get_settings().database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against the database."""
    # A separate engine without the app's foreign-keys listener: SQLite batch
    # migrations drop and recreate tables, which would cascade-delete child rows.
    connectable = create_db_engine()
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
