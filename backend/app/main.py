from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings, require_secret
from app.db import SessionDep
from app.routers import auth, boards, portals, templates, widget_data, widgets


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # Refuse to start with a missing or weak signing secret. Checked here, not in Settings, so
    # Alembic and scripts (which read settings but never sign anything) don't need them.
    # JWT_SECRET signs the pb_session log-in cookie; SESSION_SECRET signs the pb_oauth cookie
    # that holds the OAuth state (the middleware below reads it at import time, so this is
    # what catches a missing one).
    settings = get_settings()
    require_secret(settings.jwt_secret, "JWT_SECRET")
    require_secret(settings.session_secret, "SESSION_SECRET")
    yield


app = FastAPI(title="portal-boards", lifespan=lifespan)
settings = get_settings()
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret.get_secret_value(),
    session_cookie="pb_oauth",
    same_site="lax",
    https_only=settings.app_url.startswith("https"),
)
app.include_router(templates.router)
app.include_router(portals.router)
app.include_router(boards.routerPortal)
app.include_router(boards.routerBoard)
app.include_router(widgets.routerBoard)
app.include_router(widgets.routerWidget)
app.include_router(widget_data.router)
app.include_router(auth.router)


@app.get("/api/health")
def health(session: SessionDep) -> dict[str, str]:
    session.execute(select(1)).scalar_one()
    return {"status": "ok", "database": "ok"}
