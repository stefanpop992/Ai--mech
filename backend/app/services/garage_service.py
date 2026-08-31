from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.car import Car
from app.db.models.garage import Garage
from app.db.models.garage_car import GarageCar
from app.db.models.user import User


def get_or_create_garage(db: Session, user_id: int) -> Garage:
    garage = db.scalar(select(Garage).where(Garage.user_id == user_id))
    if garage:
        return garage

    garage = Garage(user_id=user_id, name="Mitt garage")
    db.add(garage)
    db.commit()
    db.refresh(garage)
    return garage


def verify_car_in_garage(db: Session, user: User, car_id: int) -> Car:
    """Ensure the car exists and sits in the user's garage, else 404."""
    garage = get_or_create_garage(db, user.id)
    link = (
        db.query(GarageCar)
        .filter(GarageCar.garage_id == garage.id, GarageCar.car_id == car_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i ditt garage")
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen finns inte")
    return car
