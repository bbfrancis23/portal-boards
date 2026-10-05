from fastapi import FastAPI
from sqlmodel import select

from app.db import SessionDep

app = FastAPI(title="portal-boards")


@app.get("/api/health")
def health(session: SessionDep) -> dict[str, str]:
    session.exec(select(1)).one()
    return {"status": "ok", "database": "ok"}
