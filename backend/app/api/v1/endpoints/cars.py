from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.garage_car import GarageCar
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.car import CarCreateManual, CarRead, CarRegisterRequest, CarUpdate
from app.services.car_info import lookup_car_by_regnr, normalize_regnr
from app.services.garage_service import get_or_create_garage

router = APIRouter(prefix="/cars", tags=["cars"])


# PUBLIC: Look up a car by regnr without auth
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


# AUTH: List cars in my garage
@router.get("", response_model=list[CarRead])
def list_my_cars(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)
    return (
        db.execute(
            select(Car)
            .join(GarageCar, GarageCar.car_id == Car.id)
            .where(GarageCar.garage_id == garage.id)
            .order_by(Car.id.desc())
        )
        .scalars()
        .all()
    )


# AUTH: Add a car to my garage by regnr (auto-lookup)
@router.post("/register", response_model=CarRead)
def register_car(
    payload: CarRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)
    regnr = normalize_regnr(payload.regnr)

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

    link = db.query(GarageCar).filter(
        GarageCar.garage_id == garage.id, GarageCar.car_id == car.id
    ).first()
    if not link:
        db.add(GarageCar(garage_id=garage.id, car_id=car.id))
        db.commit()

    return car


# AUTH: Add a car to my garage manually
@router.post("", response_model=CarRead)
def create_car_manual(
    payload: CarCreateManual,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)

    car = db.query(Car).filter(Car.regnr == payload.regnr).first()
    if not car:
        car = Car(
            regnr=payload.regnr,
            make=payload.make,
            model=payload.model,
            engine=payload.engine,
            year=payload.year,
        )
        db.add(car)
        db.commit()
        db.refresh(car)

    link = db.query(GarageCar).filter(
        GarageCar.garage_id == garage.id, GarageCar.car_id == car.id
    ).first()
    if link:
        raise HTTPException(status_code=409, detail="Bilen finns redan i ditt garage")
    db.add(GarageCar(garage_id=garage.id, car_id=car.id))
    db.commit()
    return car


# AUTH: Remove a car from my garage
@router.delete("/{car_id}")
def remove_car_from_my_garage(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)
    link = db.query(GarageCar).filter(
        GarageCar.garage_id == garage.id, GarageCar.car_id == car_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    db.delete(link)
    db.commit()
    return {"message": "Bilen har tagits bort från ditt garage!"}


# AUTH: Update car info (only if in my garage)
@router.put("/{car_id}", response_model=CarRead)
def update_car(
    car_id: int,
    payload: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    garage = get_or_create_garage(db, current_user.id)
    link = db.query(GarageCar).filter(
        GarageCar.garage_id == garage.id, GarageCar.car_id == car_id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen finns inte")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(car, key, value)
    db.add(car)
    db.commit()
    db.refresh(car)
    return car
