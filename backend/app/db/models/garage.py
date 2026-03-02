from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Garage(Base):
    __tablename__ = "garages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Mitt garage"
    )

    user = relationship("User", back_populates="garage")
    cars = relationship(
        "GarageCar", back_populates="garage", cascade="all, delete-orphan"
    )
