from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ServiceLog(Base):
    """En service-händelse kopplad till en bil och användare."""

    __tablename__ = "service_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    car_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cars.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # When & where
    service_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    workshop: Mapped[str | None] = mapped_column(String(256), nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    car = relationship("Car", backref="service_logs")
    user = relationship("User", backref="service_logs")
    items = relationship(
        "ServiceLogItem",
        back_populates="service_log",
        cascade="all, delete-orphan",
    )
    images = relationship(
        "ServiceLogImage",
        back_populates="service_log",
        cascade="all, delete-orphan",
    )


class ServiceLogItem(Base):
    """En enskild åtgärd i en service (t.ex. 'Oljebyte', 'Bromsskivor fram')."""

    __tablename__ = "service_log_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_log_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_logs.id", ondelete="CASCADE"), index=True
    )

    category: Mapped[str] = mapped_column(String(64), nullable=False)
    label: Mapped[str] = mapped_column(String(128), nullable=False)
    checked: Mapped[bool] = mapped_column(Boolean, default=True)

    service_log = relationship("ServiceLog", back_populates="items")


class ServiceLogImage(Base):
    """Bild/bevis kopplad till en service-logg."""

    __tablename__ = "service_log_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    service_log_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_logs.id", ondelete="CASCADE"), index=True
    )

    filename: Mapped[str] = mapped_column(String(256))
    stored_path: Mapped[str] = mapped_column(String(512))
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(128))
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    service_log = relationship("ServiceLog", back_populates="images")
