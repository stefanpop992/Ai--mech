from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.garage import Garage


def get_or_create_garage(db: Session, user_id: int) -> Garage:
    garage = db.scalar(select(Garage).where(Garage.user_id == user_id))
    if garage:
        return garage

    garage = Garage(user_id=user_id, name="Mitt garage")
    db.add(garage)
    db.commit()
    db.refresh(garage)
    return garage
