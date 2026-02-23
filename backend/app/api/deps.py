from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models.user import User
from app.db.session import get_db

COOKIE_NAME = "access_token"


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
