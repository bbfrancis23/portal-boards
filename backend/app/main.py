from fastapi import FastAPI
from sqlalchemy import select

from app.db import SessionDep

app = FastAPI(title="portal-boards")


@app.get("/api/health")
def health(session: SessionDep) -> dict[str, str]:
    session.execute(select(1)).scalar_one()
    return {"status": "ok", "database": "ok"}
