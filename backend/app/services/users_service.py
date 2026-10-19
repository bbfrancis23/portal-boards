from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import OAuthAccount, User


def find_or_create_oauth_user(
    session: Session,
    provider: str,  # "github" and "google"
    provider_account_id: str,  # the provider's own user id, as a string
    verified_email: str | None,
    display_name: str,
    avatar_url: str | None,
) -> User:
    """The user behind this provider account: a returning user, the same person arriving
    through a new provider (matched by verified email), or a brand-new user."""
    user = _find_by_account(session, provider, provider_account_id)
    if user is not None:
        return _refresh_profile(session, user, display_name, avatar_url)

    user = _find_by_email(session, verified_email) or _create_user(
        session, verified_email, display_name, avatar_url
    )
    return _link_account(session, user, provider, provider_account_id)


def _find_by_account(session: Session, provider: str, provider_account_id: str) -> User | None:
    return session.scalar(
        select(User)
        .join(OAuthAccount)
        .where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )


def _refresh_profile(
    session: Session, user: User, display_name: str, avatar_url: str | None
) -> User:
    """Keep the profile in step with the provider (people change names and avatars)."""
    user.display_name = display_name
    user.avatar_url = avatar_url
    session.commit()
    session.refresh(user)
    return user


def _find_by_email(session: Session, verified_email: str | None) -> User | None:
    """Only ever match on a verified email, so nobody can claim someone else's account."""
    if verified_email is None:
        return None
    return session.scalar(select(User).where(User.email == verified_email))


def _create_user(
    session: Session, verified_email: str | None, display_name: str, avatar_url: str | None
) -> User:
    user = User(email=verified_email, display_name=display_name, avatar_url=avatar_url)
    session.add(user)
    session.flush()  # gives the user an id for the OAuthAccount that follows
    return user


def _link_account(session: Session, user: User, provider: str, provider_account_id: str) -> User:
    """Add this provider account to the user (their first, or one more)."""
    session.add(
        OAuthAccount(user_id=user.id, provider=provider, provider_account_id=provider_account_id)
    )
    session.commit()
    session.refresh(user)
    return user
