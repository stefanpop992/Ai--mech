from sqlalchemy import JSON, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    regnr: Mapped[str] = mapped_column(String(16), unique=True, index=True)

    # Basic
    make: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    variant: Mapped[str | None] = mapped_column(String(128), nullable=True)
    engine: Mapped[str | None] = mapped_column(String(64), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vin: Mapped[str | None] = mapped_column(String(32), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    transmission: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Technical
    fuel: Mapped[str | None] = mapped_column(String(32), nullable=True)
    power_hp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    power_kw: Mapped[int | None] = mapped_column(Integer, nullable=True)
    kerb_weight: Mapped[int | None] = mapped_column(Integer, nullable=True)
    length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Usage
    meter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inspection: Mapped[str | None] = mapped_column(String(16), nullable=True)
    inspection_valid_until: Mapped[str | None] = mapped_column(
        String(16), nullable=True
    )

    # Origin
    manufactured: Mapped[str | None] = mapped_column(String(16), nullable=True)
    manufactured_country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    registered: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Tyres
    tyre_front: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tyre_rear: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Full API response for future use
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    garages: Mapped[list["GarageCar"]] = relationship(
        "GarageCar",
        back_populates="car",
        cascade="all, delete-orphan",
    )
