from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import OAuthAccount, User


def find_or_create_oauth_user(
    session: Session,
    provider: str,  # "github" (later "google")
    provider_account_id: str,  # the provider's own user id, as a string
    email: str | None,
    display_name: str,
    avatar_url: str | None,
) -> User:
    """The user behind this provider account, creating them on their first log-in."""
    user = session.scalar(
        select(User)
        .join(OAuthAccount)
        .where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )
    if user is not None:
        # Keep the profile in step with the provider (people change names and avatars).
        # Email stays as is: changing it could clash with another user, which #14 handles.
        user.display_name = display_name
        user.avatar_url = avatar_url
        session.commit()
        session.refresh(user)
        return user

    # First log-in with this account. Linking to an existing user by email comes in #14.
    user = User(email=email, display_name=display_name, avatar_url=avatar_url)
    session.add(user)
    session.flush()  # gives the user an id for the OAuthAccount below
    session.add(
        OAuthAccount(user_id=user.id, provider=provider, provider_account_id=provider_account_id)
    )
    session.commit()
    session.refresh(user)
    return user
