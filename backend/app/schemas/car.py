from pydantic import BaseModel


class CarRegisterRequest(BaseModel):
    regnr: str


class CarRead(BaseModel):
    id: int
    regnr: str
    make: str | None = None
    model: str | None = None
    engine: str | None = None
    year: int | None = None

    class Config:
        from_attributes = True
