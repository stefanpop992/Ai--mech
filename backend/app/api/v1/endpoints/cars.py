from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models.car import Car
from app.db.session import get_db
from app.schemas.car import CarRead, CarRegisterRequest, CarUpdate
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

@router.delete("/{car_id}")
def delete_car(car_id: int, db: Session = Depends(get_db)):
    
    car = db.query(Car).filter(Car.id == car_id).first()
    
    
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    
    
    db.delete(car)
    db.commit()
    
    return {"message": "Bilen har tagits bort!"}

@router.put("/{car_id}", response_model=CarRead)
def update_car(car_id: int, payload: CarUpdate, db: Session = Depends(get_db)):
    
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Bilen hittades inte i garaget")
    
    
    update_data = payload.model_dump(exclude_unset=True)
    
    
    for key, value in update_data.items():
        setattr(car, key, value)
    
    
    db.add(car)
    db.commit()
    db.refresh(car)
    
    return car