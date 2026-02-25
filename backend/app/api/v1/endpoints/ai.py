from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.car import Car
from pydantic import BaseModel
from app.services.ai_service import get_ai_response


# Ett litet schema bara för frågan
class AIQuestion(BaseModel):
    car_id: int
    question: str

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/ask")
def ask_mechanic(payload: AIQuestion, db: Session = Depends(get_db)):
    # 1. Hämta bilen från DB för att ge AI:n kontext (märke/modell)
    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte")
    
    # 2. Hämta svaret från vår tjänst
    answer = get_ai_response(car.make, car.model, payload.question)
    
    return {"answer": answer}