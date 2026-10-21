from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    Dialect,
    ForeignKey,
    MetaData,
    TypeDecorator,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class UTCDateTime(TypeDecorator[datetime]):
    """Store timezone-aware datetimes as UTC, and always read them back as UTC-aware.

    SQLite has no timezone support, so without this it would return naive datetimes.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.utcoffset() is None:
            raise ValueError("Datetimes must be timezone-aware, e.g. datetime.now(UTC).")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.utcoffset() is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class Base(DeclarativeBase):
    # Predictable names for indexes and constraints, so later migrations can find them by name.
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_N_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )

    # Which column type each Python type gets, so models only need `Mapped[...]`.
    type_annotation_map = {
        datetime: UTCDateTime(),
        dict[str, Any]: JSON,
        list[dict[str, Any]]: JSON,
    }


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(unique=True)
    display_name: Mapped[str]
    avatar_url: Mapped[str | None]
    is_guest: Mapped[bool] = mapped_column(default=False)
    default_portal_id: Mapped[int | None] = mapped_column(
        ForeignKey("portals.id", ondelete="SET NULL", use_alter=True)
    )
    expires_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"
    __table_args__ = (UniqueConstraint("provider", "provider_account_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str]
    provider_account_id: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Portal(Base):
    __tablename__ = "portals"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str]
    # The template this portal was copied from, e.g. "wellness-studio" (None for a blank portal).
    template_id: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[int] = mapped_column(primary_key=True)
    portal_id: Mapped[int] = mapped_column(ForeignKey("portals.id", ondelete="CASCADE"), index=True)
    label: Mapped[str]
    position: Mapped[int] = mapped_column(default=0)
    persona_id: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class WidgetInstance(Base):
    __tablename__ = "widget_instances"

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    type: Mapped[str]
    x: Mapped[int]
    y: Mapped[int]
    w: Mapped[int]
    h: Mapped[int]
    config: Mapped[dict[str, Any]] = mapped_column(default=lambda: {})
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class WidgetData(Base):
    __tablename__ = "widget_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    widget_instance_id: Mapped[int] = mapped_column(
        ForeignKey("widget_instances.id", ondelete="CASCADE"), index=True
    )
    data: Mapped[dict[str, Any]]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str]
    content: Mapped[list[dict[str, Any]]]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
