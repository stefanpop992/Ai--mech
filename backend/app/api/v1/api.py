from app.api.v1.endpoints.cars import router as cars_router
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(cars_router)
