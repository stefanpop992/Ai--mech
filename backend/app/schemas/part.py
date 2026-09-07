from datetime import date, datetime

from pydantic import BaseModel, Field

VALID_CATEGORIES = {
    "filters",
    "brakes",
    "tires_wheels",
    "timing",
    "battery",
    "wipers",
    "lighting",
    "fluids_oil",
    "other",
}

VALID_STATUSES = {"installed", "spare", "ordered"}


class PartCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    category: str = Field(..., max_length=64)
    brand: str | None = Field(None, max_length=128)
    part_number: str | None = Field(None, max_length=128)
    quantity: int = Field(1, ge=1)
    vendor: str | None = Field(None, max_length=256)
    cost: float | None = None
    purchased_date: date | None = None
    installed_date: date | None = None
    mileage: int | None = None
    status: str = "installed"
    notes: str | None = None


class PartUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    category: str | None = Field(None, max_length=64)
    brand: str | None = Field(None, max_length=128)
    part_number: str | None = Field(None, max_length=128)
    quantity: int | None = Field(None, ge=1)
    vendor: str | None = Field(None, max_length=256)
    cost: float | None = None
    purchased_date: date | None = None
    installed_date: date | None = None
    mileage: int | None = None
    status: str | None = None
    notes: str | None = None


class PartRead(BaseModel):
    id: int
    car_id: int
    name: str
    category: str
    brand: str | None
    part_number: str | None
    quantity: int
    vendor: str | None
    cost: float | None
    purchased_date: date | None
    installed_date: date | None
    mileage: int | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
