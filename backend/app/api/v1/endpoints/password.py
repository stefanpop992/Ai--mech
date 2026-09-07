import logging
from app.api.deps import COOKIE_NAME
import secrets
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import hash_password as get_password_hash
from app.db.models.session import Session as DBSession
from app.schemas.auth import ResetPasswordRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

resend.api_key = settings.RESEND_API_KEY


class ForgotPasswordRequest(BaseModel):
    email: str


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

    logger.info("Sending password reset email (user_id=%s)", user.id)

    try:
        resend.Emails.send({
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
    except Exception:
        logger.exception("Password reset email failed to send (user_id=%s)", user.id)
        raise HTTPException(status_code=500, detail="Kunde inte skicka mail.")

    return {"message": "Om e-posten finns skickar vi en återställningslänk."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == payload.token).with_for_update().populate_existing().first()

    if not user:
        raise HTTPException(status_code=400, detail="Ogiltig återställningslänk.")

    expires = user.reset_token_expires
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires is None or expires <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Länken har gått ut. Begär en ny.")

    # Update password and clear token
    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.query(DBSession).filter(DBSession.user_id == user.id).delete(synchronize_session=False)
    db.commit()
    response.delete_cookie(key=COOKIE_NAME, path="/")

    return {"message": "Lösenordet har uppdaterats!"}
