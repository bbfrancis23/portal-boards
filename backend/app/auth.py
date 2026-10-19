from datetime import timedelta
from typing import Annotated, Any

import jwt
from fastapi import Cookie, Depends, HTTPException, Response, status

from app.config import get_settings, require_secret
from app.db import SessionDep
from app.models import User, utcnow


def create_session_token(user_id: int) -> str:
    now = utcnow()
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(days=7)}
    # Never sign with a weak key, even if something skipped the startup check.
    return jwt.encode(
        payload, require_secret(get_settings().jwt_secret, "JWT_SECRET"), algorithm="HS256"
    )


def read_session_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token,
            get_settings().jwt_secret.get_secret_value(),
            algorithms=["HS256"],
        )
    except jwt.PyJWTError:
        return None


def set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        "pb_session",
        create_session_token(user_id),
        httponly=True,
        samesite="lax",
        secure=get_settings().app_url.startswith("https"),
        max_age=7 * 24 * 60 * 60,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        "pb_session",
        httponly=True,
        samesite="lax",
        secure=get_settings().app_url.startswith("https"),
    )


def get_current_user(
    session: SessionDep,
    response: Response,
    pb_session: Annotated[str | None, Cookie()] = None,
) -> User:

    if not pb_session:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not logged in")
    token = read_session_token(pb_session)
    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")
    user = session.get(User, int(token["sub"]))

    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")

    if utcnow().timestamp() - token["iat"] > 24 * 60 * 60:
        set_session_cookie(response, user.id)

    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
