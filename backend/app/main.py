from fastapi import FastAPI

app = FastAPI(title="portal-boards")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
