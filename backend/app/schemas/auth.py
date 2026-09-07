from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr


def validate_new_password(value: str) -> str:
    if len(value) < 6:
        raise ValueError("Lösenordet måste vara minst 6 tecken")
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Lösenordet är för långt (max 72 byte i UTF-8)")
    return value


NewPassword = Annotated[str, AfterValidator(validate_new_password)]


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: NewPassword


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: NewPassword


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
