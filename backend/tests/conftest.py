from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import get_current_user
from app.db import get_session
from app.main import app
from app.models import Base, User


@pytest.fixture
def session():
    """A fresh in-memory database with all tables, for one test."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


@pytest.fixture
def user(session: Session) -> User:
    """A saved user to own portals."""
    user = User(email="owner@example.com", display_name="Owner")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    """An API client whose routes use the test database instead of the real one."""
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def dev_user(session: Session) -> User:
    """The user the API acts as (the temporary dev user, until real login in M3)."""
    return get_current_user(session)


@pytest.fixture
def other_user(session: Session) -> User:
    """Someone else, whose portals and boards the dev user must never see or change."""
    other = User(email="other@example.com", display_name="Other")
    session.add(other)
    session.commit()
    session.refresh(other)
    return other
