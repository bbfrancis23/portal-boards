from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import OAuthAccount, User
from app.services.users_service import find_or_create_oauth_user


def log_in_with_github(session: Session, github_id: str = "31833702") -> User:
    return find_or_create_oauth_user(
        session,
        provider="github",
        provider_account_id=github_id,
        email="brian@example.com",
        display_name="Brian",
        avatar_url="https://avatars.example.com/brian",
    )


def count(session: Session, model: type) -> int:
    return session.scalar(select(func.count()).select_from(model)) or 0


def test_first_log_in_creates_the_user_and_their_account(session: Session) -> None:
    user = log_in_with_github(session)

    assert user.email == "brian@example.com"
    assert user.display_name == "Brian"
    assert user.avatar_url == "https://avatars.example.com/brian"
    account = session.scalar(select(OAuthAccount).where(OAuthAccount.user_id == user.id))
    assert account is not None
    assert (account.provider, account.provider_account_id) == ("github", "31833702")


def test_logging_in_again_returns_the_same_user(session: Session) -> None:
    first = log_in_with_github(session)
    again = log_in_with_github(session)

    assert again.id == first.id
    assert count(session, User) == 1
    assert count(session, OAuthAccount) == 1


def test_a_different_github_account_is_a_different_user(session: Session) -> None:
    brian = log_in_with_github(session, github_id="1")
    someone_else = find_or_create_oauth_user(
        session,
        provider="github",
        provider_account_id="2",
        email="else@example.com",
        display_name="Someone",
        avatar_url=None,
    )

    assert someone_else.id != brian.id
    assert count(session, User) == 2


def test_logging_in_again_updates_name_and_avatar(session: Session) -> None:
    first = log_in_with_github(session)

    again = find_or_create_oauth_user(
        session,
        provider="github",
        provider_account_id="31833702",
        email="brian@example.com",
        display_name="Brian F.",
        avatar_url="https://avatars.example.com/brian-new",
    )

    assert again.id == first.id
    assert again.display_name == "Brian F."
    assert again.avatar_url == "https://avatars.example.com/brian-new"
