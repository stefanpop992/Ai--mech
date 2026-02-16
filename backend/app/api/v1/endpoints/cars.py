from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models.car import Car
from app.db.session import get_db
from app.schemas.car import CarRead, CarRegisterRequest
from app.services.car_info import lookup_car_by_regnr, normalize_regnr

router = APIRouter(prefix="/cars", tags=["cars"])


@router.get("", response_model=list[CarRead])
def list_cars(db: Session = Depends(get_db)):
    return db.query(Car).order_by(Car.id.desc()).all()


@router.post("/register", response_model=CarRead)
def register_car(payload: CarRegisterRequest, db: Session = Depends(get_db)):
    regnr = normalize_regnr(payload.regnr)

    existing = db.query(Car).filter(Car.regnr == regnr).first()
    if existing:
        return existing

    info = lookup_car_by_regnr(regnr)

    car = Car(
        regnr=regnr,
        make=info.get("make"),
        model=info.get("model"),
        engine=info.get("engine"),
        year=info.get("year"),
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return car
