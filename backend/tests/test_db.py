from sqlalchemy import text

from app.db import engine


def test_sqlite_foreign_keys_enabled() -> None:
    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar() == 1
