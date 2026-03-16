from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CarDocument(Base):
    __tablename__ = "car_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    car_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cars.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    category: Mapped[str] = mapped_column(String(64))
    filename: Mapped[str] = mapped_column(String(256))
    stored_path: Mapped[str] = mapped_column(String(512))
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(128))
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    car = relationship("Car", backref="documents")
    user = relationship("User", backref="documents")
