from datetime import date, datetime

from pydantic import BaseModel, Field

# ── Items ──────────────────────────────────────────────────────────────────────


class ServiceLogItemCreate(BaseModel):
    category: str = Field(..., max_length=64)
    label: str = Field(..., max_length=128)
    checked: bool = True


class ServiceLogItemRead(BaseModel):
    id: int
    category: str
    label: str
    checked: bool

    class Config:
        from_attributes = True


# ── Images ─────────────────────────────────────────────────────────────────────


class ServiceLogImageRead(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Service Log ────────────────────────────────────────────────────────────────


class ServiceLogCreate(BaseModel):
    service_date: date
    mileage: int | None = None
    workshop: str | None = Field(None, max_length=256)
    cost: float | None = None
    notes: str | None = None
    items: list[ServiceLogItemCreate] = []


class ServiceLogUpdate(BaseModel):
    service_date: date | None = None
    mileage: int | None = None
    workshop: str | None = None
    cost: float | None = None
    notes: str | None = None
    items: list[ServiceLogItemCreate] | None = None


class ServiceLogRead(BaseModel):
    id: int
    car_id: int
    service_date: date
    mileage: int | None
    workshop: str | None
    cost: float | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[ServiceLogItemRead] = []
    images: list[ServiceLogImageRead] = []

    class Config:
        from_attributes = True


class ServiceLogSummary(BaseModel):
    """Lättviktig variant för listvy."""

    id: int
    car_id: int
    service_date: date
    mileage: int | None
    workshop: str | None
    cost: float | None
    item_count: int
    image_count: int
    categories: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
