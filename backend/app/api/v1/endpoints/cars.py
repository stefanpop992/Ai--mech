from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.garage_car import GarageCar
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.car import CarRead, CarRegisterRequest, CarUpdate
from app.services.car_info import lookup_car_by_regnr, normalize_regnr
from app.services.garage_service import get_or_create_garage

router = APIRouter(prefix="/cars", tags=["cars"])


#  PUBLIC: Vem som helst kan slå upp en bil via regnr
@router.get("/lookup", response_model=CarRead)
def lookup_car(regnr: str, db: Session = Depends(get_db)):
    regnr_n = normalize_regnr(regnr)

    existing = db.query(Car).filter(Car.regnr == regnr_n).first()
    if existing:
        return existing

    info = lookup_car_by_regnr(regnr_n)
    car = Car(
        regnr=regnr_n,
        make=info.get("make"),
        model=info.get("model"),
        engine=info.get("engine"),
        year=info.get("year"),
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


#  AUTH: Lista MINA bilar (mitt garage)
@router.get("", response_model=list[CarRead])
def list_my_cars(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)

    cars = (
        db.execute(
            select(Car)
            .join(GarageCar, GarageCar.car_id == Car.id)
            .where(GarageCar.garage_id == garage.id)
            .order_by(Car.id.desc())
        )
        .scalars()
        .all()
    )

    return cars


#  AUTH: Lägg till bil i MITT garage (idempotent)
@router.post("/register", response_model=CarRead)
def register_car(
    payload: CarRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)
    regnr = normalize_regnr(payload.regnr)

    # 1) se till att bilen finns i katalogen
    car = db.query(Car).filter(Car.regnr == regnr).first()
    if not car:
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

    # 2) skapa länk garage -> car (om den inte redan finns)
    link = (
        db.query(GarageCar)
        .filter(GarageCar.garage_id == garage.id, GarageCar.car_id == car.id)
        .first()
    )
    if not link:
        db.add(GarageCar(garage_id=garage.id, car_id=car.id))
        db.commit()

    return car


#  AUTH: Ta bort bil från MITT garage (radera inte katalograden)
@router.delete("/{car_id}")
def remove_car_from_my_garage(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)

    link = (
        db.query(GarageCar)
        .filter(GarageCar.garage_id == garage.id, GarageCar.car_id == car_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")

    db.delete(link)
    db.commit()
    return {"message": "Bilen har tagits bort från ditt garage!"}


# AUTH: Uppdatera info för en bil (bara om den finns i mitt garage)
@router.put("/{car_id}", response_model=CarRead)
def update_car(
    car_id: int,
    payload: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)

    link = (
        db.query(GarageCar)
        .filter(GarageCar.garage_id == garage.id, GarageCar.car_id == car_id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")

    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen finns inte")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(car, key, value)

    db.add(car)
    db.commit()
    db.refresh(car)
    return car
