from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings


# Ändra detta i backend/app/core/security.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b")

def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")
    # Vi tvingar lösenordet till en sträng och klipper vid 72 tecken
    # Detta är den kritiska fixen för att slippa 500-felet!
    return pwd_context.hash(str(password)[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifierar lösenord mot lagrad hash."""
    if not plain_password or not hashed_password:
        return False
    return pwd_context.verify(str(plain_password)[:72], hashed_password)

def create_access_token(subject: Union[str, Any]) -> str:
    """Skapar en säker JWT-token."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def decode_token(token: str) -> dict:
    """Avkodar och validerar JWT-token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError:
        raise ValueError("Could not validate credentials")