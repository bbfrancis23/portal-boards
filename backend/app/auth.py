from typing import Annotated

from fastapi import Depends
from sqlalchemy import select

from app.db import SessionDep
from app.models import User

DEV_EMAIL = "dev@portal-boards.local"


def get_current_user(session: SessionDep) -> User:
    user = session.scalar(select(User).where(User.email == DEV_EMAIL))
    if user is None:
        user = User(email=DEV_EMAIL, display_name="Dev")
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
