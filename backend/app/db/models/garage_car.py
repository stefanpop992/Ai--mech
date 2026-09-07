from sqlalchemy import ForeignKey, Integer, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GarageCar(Base):
    __tablename__ = "garage_cars"
    __table_args__ = (UniqueConstraint("garage_id", "car_id", name="uq_garage_car"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    garage_id: Mapped[int] = mapped_column(
        ForeignKey("garages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    car_id: Mapped[int] = mapped_column(
        ForeignKey("cars.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    overrides: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    garage = relationship("Garage", back_populates="cars")
    car = relationship("Car", back_populates="garages")
