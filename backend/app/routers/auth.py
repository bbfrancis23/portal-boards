from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.auth import DEV_EMAIL, CurrentUserDep, clear_session_cookie, set_session_cookie
from app.config import get_settings
from app.db import SessionDep
from app.models import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/api", tags=["auth", "user"])


@router.get("/users/me")
def get_user(user: CurrentUserDep) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(response: Response) -> None:
    clear_session_cookie(response)


@router.post("/auth/dev-login", status_code=status.HTTP_204_NO_CONTENT)
def dev_login(session: SessionDep, response: Response) -> None:
    """Temporary: log in as the dev user until GitHub log-in exists (#12 removes this).

    Only works when DEV_LOGIN_ENABLED=true; otherwise it behaves as if the route didn't exist.
    """
    if not get_settings().dev_login_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")
    user = session.scalar(select(User).where(User.email == DEV_EMAIL))
    if user is None:
        user = User(email=DEV_EMAIL, display_name="Dev")
        session.add(user)
        session.commit()
        session.refresh(user)
    set_session_cookie(response, user.id)
