from fastapi import FastAPI
from sqlalchemy import select

from app.db import SessionDep
from app.routers import boards, portals, templates

app = FastAPI(title="portal-boards")
app.include_router(templates.router)
app.include_router(portals.router)
app.include_router(boards.routerPortal)
app.include_router(boards.routerBoard)


@app.get("/api/health")
def health(session: SessionDep) -> dict[str, str]:
    session.execute(select(1)).scalar_one()
    return {"status": "ok", "database": "ok"}
