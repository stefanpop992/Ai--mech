import secrets

from passlib.context import CryptContext

from app.schemas.auth import validate_new_password

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b")


def hash_password(password: str) -> str:
    return pwd_context.hash(validate_new_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    return pwd_context.verify(str(plain_password)[:72], hashed_password)


def generate_session_token() -> str:
    """Generate a cryptographically secure 64-char hex token."""
    return secrets.token_hex(32)
