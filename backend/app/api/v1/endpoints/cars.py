from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.car import CarCreateManual, CarRead, CarRegisterRequest, CarUpdate
from app.services.car_info import lookup_car_by_regnr, normalize_regnr

router = APIRouter(prefix="/cars", tags=["cars"])


@router.get("", response_model=list[CarRead])
def list_cars(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Car).filter(Car.user_id == current_user.id).order_by(Car.id.desc()).all()


@router.post("", response_model=CarRead)
def create_car_manual(
    payload: CarCreateManual,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Car).filter(Car.regnr == payload.regnr).first():
        raise HTTPException(status_code=409, detail="Regnumret finns redan i garaget")
    car = Car(
        user_id=current_user.id,
        regnr=payload.regnr,
        make=payload.make,
        model=payload.model,
        engine=payload.engine,
        year=payload.year,
    )
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.post("/register", response_model=CarRead)
def register_car(
    payload: CarRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    regnr = normalize_regnr(payload.regnr)

    if db.query(Car).filter(Car.regnr == regnr).first():
        raise HTTPException(status_code=409, detail="Regnumret finns redan i garaget")

    info = lookup_car_by_regnr(regnr)
    car = Car(
        user_id=current_user.id,
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


@router.delete("/{car_id}")
def delete_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    car = db.query(Car).filter(Car.id == car_id, Car.user_id == current_user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    db.delete(car)
    db.commit()
    return {"message": "Bilen har tagits bort!"}


@router.put("/{car_id}", response_model=CarRead)
def update_car(
    car_id: int,
    payload: CarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    car = db.query(Car).filter(Car.id == car_id, Car.user_id == current_user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(car, key, value)
    db.add(car)
    db.commit()
    db.refresh(car)
    return car
