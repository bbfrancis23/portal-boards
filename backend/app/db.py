from collections.abc import Iterator
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, create_engine

from app.config import get_settings


def create_db_engine() -> Engine:
    """Create an engine for DATABASE_URL, without foreign-key enforcement (used by migrations)."""
    settings = get_settings()
    url = settings.database_url
    connect_args: dict[str, Any] = {}
    if url.startswith("sqlite+libsql"):
        connect_args["auth_token"] = settings.turso_auth_token.get_secret_value()
    elif url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(url, connect_args=connect_args)


engine = create_db_engine()


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
