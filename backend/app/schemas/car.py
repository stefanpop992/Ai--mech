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
    variant: str | None = None
    engine: str | None = None
    year: int | None = None
    vin: str | None = None
    color: str | None = None
    status: str | None = None
    transmission: str | None = None
    fuel: str | None = None
    power_hp: int | None = None
    power_kw: int | None = None
    kerb_weight: int | None = None
    length: int | None = None
    width: int | None = None
    meter: int | None = None
    inspection: str | None = None
    inspection_valid_until: str | None = None
    manufactured: str | None = None
    manufactured_country: str | None = None
    registered: str | None = None
    tyre_front: str | None = None
    tyre_rear: str | None = None

    class Config:
        from_attributes = True


class CarUpdate(BaseModel):
    make: str | None = None
    model: str | None = None
    engine: str | None = None
    year: int | None = None
