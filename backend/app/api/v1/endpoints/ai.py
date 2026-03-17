from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.chat_message import ChatMessage
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.ai_chat import AIQuestion, AIResponse, ChatMessageRead
from app.services.ai_service import get_ai_response

router = APIRouter(prefix="/ai", tags=["ai"])

FREE_DAILY_LIMIT = 10
FREE_MAX_TOKENS = 500
PREMIUM_MAX_TOKENS = 2000


def _today_start() -> datetime:
    """Midnight UTC for today."""
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _count_today(db: Session, user_id: int) -> int:
    return (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= _today_start(),
        )
        .count()
    )


@router.get("/usage")
def get_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.plan == "premium":
        return {"plan": "premium", "messages_today": None, "messages_remaining": None}

    count = _count_today(db, current_user.id)
    return {
        "plan": "free",
        "messages_today": count,
        "messages_remaining": max(0, FREE_DAILY_LIMIT - count),
    }


@router.get("/history")
def get_history(
    car_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.plan != "premium":
        raise HTTPException(status_code=403, detail="Chatthistorik kräver Premium")

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.car_id == car_id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return [
        {
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.post("/ask", response_model=AIResponse)
def ask_mechanic(
    payload: AIQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_premium = current_user.plan == "premium"

    # Check daily limit for free users
    if not is_premium:
        count = _count_today(db, current_user.id)
        if count >= FREE_DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Du har använt alla dina {FREE_DAILY_LIMIT} gratis meddelanden idag. "
                    "Uppgradera till Premium för obegränsad AI-chat."
                ),
            )

    # Fetch car
    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte")

    # Build history for AI call
    history = (
        [{"role": msg.role, "content": msg.content} for msg in payload.history]
        if payload.history
        else None
    )

    # Call AI with plan-appropriate token limit
    max_tokens = PREMIUM_MAX_TOKENS if is_premium else FREE_MAX_TOKENS
    answer = get_ai_response(
        car_make=car.make,
        car_model=car.model,
        car_year=car.year,
        car_engine=car.engine,
        question=payload.question,
        history=history,
        max_output_tokens=max_tokens,
    )

    # Save messages to DB (all users — free for counting, premium for history)
    db.add(ChatMessage(
        user_id=current_user.id,
        car_id=car.id,
        role="user",
        content=payload.question,
    ))
    db.add(ChatMessage(
        user_id=current_user.id,
        car_id=car.id,
        role="assistant",
        content=answer,
    ))
    db.commit()

    # Return remaining count for free users
    messages_remaining = None
    if not is_premium:
        new_count = _count_today(db, current_user.id)
        messages_remaining = max(0, FREE_DAILY_LIMIT - new_count)

    return AIResponse(answer=answer, messages_remaining=messages_remaining)
