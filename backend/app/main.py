from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select

from app.config import get_settings, require_jwt_secret
from app.db import SessionDep
from app.routers import auth, boards, portals, templates, widget_data, widgets


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    # Refuse to start with a missing or weak JWT secret. Checked here, not in Settings, so
    # Alembic and scripts (which read settings but never sign tokens) don't need one.
    require_jwt_secret(get_settings())
    yield


app = FastAPI(title="portal-boards", lifespan=lifespan)
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
