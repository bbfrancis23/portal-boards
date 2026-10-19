import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import DEV_EMAIL, create_session_token
from app.config import get_settings
from app.db import get_session
from app.main import app
from app.models import Base, User

# Tests sign their own session tokens, so they need a secret even where there's no .env (CI).
# A real environment variable wins over .env, so this also keeps tests off your local secret.
# Importing the app above already read (and cached) the settings, so clear that cache.
os.environ["JWT_SECRET"] = "test-secret-not-used-anywhere-else-0123456789"
get_settings.cache_clear()


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
def client(session: Session, dev_user: User) -> Iterator[TestClient]:
    """An API client on the test database, logged in as the dev user (it sends their cookie)."""
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as test_client:
        # Set for the test client's own domain, as the server would, so a logout really removes it.
        test_client.cookies.set(
            "pb_session", create_session_token(dev_user.id), domain="testserver.local"
        )
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def anonymous_client(session: Session) -> Iterator[TestClient]:
    """An API client on the test database that isn't logged in (no cookie)."""
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def dev_user(session: Session) -> User:
    """The user the `client` fixture is logged in as."""
    user = User(email=DEV_EMAIL, display_name="Dev")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def other_user(session: Session) -> User:
    """Someone else, whose portals and boards the dev user must never see or change."""
    other = User(email="other@example.com", display_name="Other")
    session.add(other)
    session.commit()
    session.refresh(other)
    return other
