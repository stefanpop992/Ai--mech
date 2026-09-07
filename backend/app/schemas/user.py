from typing import Optional

from pydantic import BaseModel, EmailStr

from app.schemas.auth import NewPassword


class UserCreate(BaseModel):
    email: EmailStr
    password: NewPassword


class UserRead(BaseModel):
    id: int
    email: EmailStr
    plan: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True
