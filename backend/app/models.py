from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, UniqueConstraint
from sqlmodel import Field, SQLModel

# Predictable names for indexes and constraints, so later migrations can find them by name.
SQLModel.metadata.naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str | None = Field(default=None, unique=True)
    display_name: str
    avatar_url: str | None = None
    is_guest: bool = False
    expires_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)


class OAuthAccount(SQLModel, table=True):
    __tablename__ = "oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_account_id"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    provider: str
    provider_account_id: str
    created_at: datetime = Field(default_factory=utcnow)


class Portal(SQLModel, table=True):
    __tablename__ = "portals"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    name: str
    template: str | None = None
    created_at: datetime = Field(default_factory=utcnow)


class Board(SQLModel, table=True):
    __tablename__ = "boards"

    id: int | None = Field(default=None, primary_key=True)
    portal_id: int = Field(foreign_key="portals.id", ondelete="CASCADE", index=True)
    label: str
    position: int = 0
    persona_id: str | None = None
    created_at: datetime = Field(default_factory=utcnow)


class WidgetInstance(SQLModel, table=True):
    __tablename__ = "widget_instances"

    id: int | None = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="boards.id", ondelete="CASCADE", index=True)
    type: str
    x: int
    y: int
    w: int
    h: int
    config: dict[str, Any] = Field(default_factory=dict, sa_type=JSON)
    created_at: datetime = Field(default_factory=utcnow)


class WidgetData(SQLModel, table=True):
    __tablename__ = "widget_data"

    id: int | None = Field(default=None, primary_key=True)
    widget_instance_id: int = Field(
        foreign_key="widget_instances.id", ondelete="CASCADE", index=True
    )
    data: dict[str, Any] = Field(sa_type=JSON)
    created_at: datetime = Field(default_factory=utcnow)


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: int | None = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="boards.id", ondelete="CASCADE", index=True)
    created_at: datetime = Field(default_factory=utcnow)


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", ondelete="CASCADE", index=True)
    role: str
    content: list[dict[str, Any]] = Field(sa_type=JSON)
    created_at: datetime = Field(default_factory=utcnow)
