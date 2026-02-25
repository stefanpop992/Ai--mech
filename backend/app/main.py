from fastapi import FastAPI

from app.api.v1.api import api_router

app = FastAPI(title="AI Mechanic API")


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")


from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
