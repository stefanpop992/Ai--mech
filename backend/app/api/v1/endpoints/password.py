from app.api.deps import get_current_user
import secrets
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import hash_password as get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

resend.api_key = settings.RESEND_API_KEY


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return success even if email not found (security best practice)
    if not user:
        return {"message": "Om e-posten finns skickar vi en återställningslänk."}

    # Generate token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()

    # Send email
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    print(f"[forgot-password] Sending reset email to {user.email}")
    print(f"[forgot-password] Reset URL: {reset_url}")
    print(f"[forgot-password] RESEND_API_KEY set: {bool(settings.RESEND_API_KEY)}")
    print(f"[forgot-password] MAIL_FROM: {settings.MAIL_FROM}")

    try:
        result = resend.Emails.send({
            "from": settings.MAIL_FROM,
            "to": user.email,
            "subject": "Återställ ditt lösenord — AI Mechanic",
            "html": f"""
                <h2>Återställ ditt lösenord</h2>
                <p>Klicka på länken nedan för att återställa ditt lösenord. Länken är giltig i 30 minuter.</p>
                <a href="{reset_url}">Återställ lösenord</a>
                <p>Om du inte begärt detta kan du ignorera detta mail.</p>
            """,
        })
        print(f"[forgot-password] Resend response: {result}")
    except Exception as e:
        print(f"[forgot-password] ERROR sending email: {e}")
        raise HTTPException(status_code=500, detail=f"Kunde inte skicka mail: {e}")

    return {"message": "Om e-posten finns skickar vi en återställningslänk."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == payload.token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Ogiltig återställningslänk.")

    if user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Länken har gått ut. Begär en ny.")

    # Update password and clear token
    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Lösenordet har uppdaterats!"}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Nuvarande lösenord är fel.")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Lösenordet har ändrats!"}