from pydantic import BaseModel


class CarRegisterRequest(BaseModel):
    regnr: str


class CarCreateManual(BaseModel):
    regnr: str
    make: str
    model: str
    year: int
    engine: str | None = None


class CarRead(BaseModel):
    id: int
    regnr: str
    make: str | None = None
    model: str | None = None
    engine: str | None = None
    year: int | None = None

    class Config:
        from_attributes = True

class CarUpdate(BaseModel):
    make: str | None = None
    model: str | None = None
    engine: str | None = None
    year: int | None = None