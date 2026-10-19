from typing import Any

from authlib.integrations.starlette_client import OAuthError
from fastapi import APIRouter, Request, Response, status
from fastapi.responses import RedirectResponse

from app.auth import CurrentUserDep, clear_session_cookie, set_session_cookie
from app.config import get_settings
from app.db import SessionDep
from app.oauth import oauth
from app.schemas.user import UserRead
from app.services.users_service import find_or_create_oauth_user

router = APIRouter(prefix="/api", tags=["auth", "user"])


@router.get("/users/me")
def get_user(user: CurrentUserDep) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/auth/github/login")
async def github_login(request: Request) -> RedirectResponse:
    """Send the browser to GitHub's "Authorize portal-boards?" page."""
    redirect_uri = f"{get_settings().app_url}/api/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/auth/github/callback")
async def github_callback(request: Request, session: SessionDep) -> RedirectResponse:
    """GitHub sends the browser back here: log the user in and return to the app."""
    app_url = get_settings().app_url
    try:
        token = await oauth.github.authorize_access_token(request)
    except OAuthError:
        # The user clicked Cancel on GitHub, or the state didn't match.
        return RedirectResponse(f"{app_url}/log-in")

    profile = (await oauth.github.get("user", token=token)).json()
    emails: list[dict[str, Any]] = (await oauth.github.get("user/emails", token=token)).json()
    email = next((e["email"] for e in emails if e["primary"] and e["verified"]), None)

    user = find_or_create_oauth_user(
        session,
        provider="github",
        provider_account_id=str(profile["id"]),
        email=email,
        display_name=profile["name"] or profile["login"],
        avatar_url=profile.get("avatar_url"),
    )
    response = RedirectResponse(app_url)
    set_session_cookie(response, user.id)
    return response


@router.get("/auth/google/login")
async def google_login(request: Request) -> RedirectResponse:
    """Send the browser to Google's "Authorize portal-boards?" page."""
    redirect_uri = f"{get_settings().app_url}/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def google_callback(request: Request, session: SessionDep) -> RedirectResponse:
    """Google sends the browser back here: log the user in and return to the app."""
    app_url = get_settings().app_url
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError:
        # The user clicked Cancel on Google, or the state didn't match.
        return RedirectResponse(f"{app_url}/log-in")

    userinfo = token["userinfo"]
    if not userinfo.get("email_verified"):
        return RedirectResponse(f"{app_url}/log-in")

    user = find_or_create_oauth_user(
        session,
        provider="google",
        provider_account_id=userinfo["sub"],
        email=userinfo["email"],
        display_name=userinfo.get("name") or userinfo["email"],
        avatar_url=userinfo.get("picture"),
    )
    response = RedirectResponse(app_url)
    set_session_cookie(response, user.id)
    return response
