from fastapi import APIRouter
from app.api.v1.endpoints.cars import router as cars_router
from app.api.v1.endpoints.ai import router as ai_router 

api_router = APIRouter()
api_router.include_router(cars_router)
api_router.include_router(ai_router) 