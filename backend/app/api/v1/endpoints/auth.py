import logging
import secrets
from datetime import datetime, timedelta, timezone

import resend
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.api.deps import COOKIE_NAME, get_current_user
from app.core.config import settings
from app.core.security import generate_session_token, hash_password, verify_password
from app.db.models.session import Session as DBSession
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import ChangeEmailRequest, ChangePasswordRequest, LoginRequest
from app.schemas.user import UserCreate, UserRead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

resend.api_key = settings.RESEND_API_KEY


def _create_session(db: Session, user_id: int) -> str:
    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)
    session = DBSession(user_id=user_id, token=token, expires_at=expires_at)
    db.add(session)
    db.commit()
    return token


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=bool(settings.COOKIE_SECURE),
        samesite="lax",
        path="/",
        max_age=settings.SESSION_EXPIRE_DAYS * 24 * 60 * 60,
    )


@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        verification_token=secrets.token_hex(32),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    verify_url = f"{settings.FRONTEND_ORIGIN}/verify-email?token={user.verification_token}"
    try:
        resend.Emails.send({
            "from": settings.MAIL_FROM,
            "to": user.email,
            "subject": "Aktivera ditt konto — MyGarage",
            "html": f"""
                <h2>Välkommen till MyGarage!</h2>
                <p>Klicka på länken nedan för att aktivera ditt konto.</p>
                <a href="{verify_url}">Aktivera konto</a>
                <p>Om du inte skapat något konto kan du ignorera detta mail.</p>
            """,
        })
    except Exception:
        logger.exception("Verification email failed to send")
        raise HTTPException(status_code=500, detail="Kunde inte skicka aktiveringsmail.")

    return {"message": "Kolla din mail för att aktivera ditt konto"}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Ogiltig länk")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Kontot är aktiverat"}


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Bekräfta din e-postadress innan du loggar in. Kolla din inkorg.",
        )
    token = _create_session(db, user.id)
    _set_cookie(response, token)
    return {"ok": True}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        db.query(DBSession).filter(DBSession.token == token).delete()
        db.commit()
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password", include_in_schema=False)
@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = db.query(User).filter(User.id == current_user.id).with_for_update().populate_existing().one()
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Nuvarande lösenord är felaktigt")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.reset_token = None
    current_user.reset_token_expires = None
    # Keep this browser signed in; invalidate sessions on other devices.
    db.query(DBSession).filter(
        DBSession.user_id == current_user.id,
        DBSession.token != request.cookies.get(COOKIE_NAME),
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Lösenordet har uppdaterats"}


@router.put("/change-email")
def change_email(
    payload: ChangeEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(User).filter(
        User.email == payload.new_email, User.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="E-postadressen används redan av ett annat konto")
    current_user.email = str(payload.new_email)
    db.commit()
    return {"message": "E-postadressen har uppdaterats"}
