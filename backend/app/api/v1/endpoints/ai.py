from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.ai_chat import AIQuestion, AIResponse
from app.services.ai_service import get_ai_response

router = APIRouter(prefix="/ai", tags=["ai"])

# --- Enkel rate limiter i minne ---
# Håller koll på anrop per användare: {user_id: [timestamp, ...]}
_request_log: dict[int, list[datetime]] = defaultdict(list)

MAX_REQUESTS = 20  # Max antal förfrågningar
RATE_WINDOW = timedelta(hours=1)  # Per timme


def _check_rate_limit(user_id: int) -> None:
    """Kasta 429 om användaren överskridit gränsen."""
    now = datetime.utcnow()
    cutoff = now - RATE_WINDOW

    # Rensa gamla poster
    _request_log[user_id] = [t for t in _request_log[user_id] if t > cutoff]

    if len(_request_log[user_id]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Du har nått gränsen på {MAX_REQUESTS} frågor per timme. Försök igen senare.",
        )

    _request_log[user_id].append(now)


@router.post("/ask", response_model=AIResponse)
def ask_mechanic(
    payload: AIQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Rate limit
    _check_rate_limit(current_user.id)

    # 2. Hämta bilen och kontrollera att den finns
    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte")

    # 3. Bygg historik i rätt format
    history = (
        [{"role": msg.role, "content": msg.content} for msg in payload.history]
        if payload.history
        else None
    )

    # 4. Hämta AI-svar med full kontext
    answer = get_ai_response(
        car_make=car.make,
        car_model=car.model,
        car_year=car.year,
        question=payload.question,
        history=history,
    )

    return AIResponse(answer=answer)
