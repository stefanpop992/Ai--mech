from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.part import Part
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.part import (
    VALID_CATEGORIES,
    VALID_STATUSES,
    PartCreate,
    PartRead,
    PartUpdate,
)
from app.services.garage_service import verify_car_in_garage

router = APIRouter(prefix="/cars/{car_id}/parts", tags=["parts"])


# ── Helpers ────────────────────────────────────────────────────────────────────


def _validate_category(category: str) -> None:
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Ogiltig kategori: {category}")


def _validate_status(status: str) -> None:
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Ogiltig status: {status}")


def _get_part_or_404(db: Session, user: User, car_id: int, part_id: int) -> Part:
    part = (
        db.query(Part)
        .filter(
            Part.id == part_id,
            Part.car_id == car_id,
            Part.user_id == user.id,
        )
        .first()
    )
    if not part:
        raise HTTPException(status_code=404, detail="Delen hittades inte")
    return part


# ── CRUD ───────────────────────────────────────────────────────────────────────


@router.get("", response_model=list[PartRead])
def list_parts(
    car_id: int,
    category: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    query = db.query(Part).filter(
        Part.car_id == car_id,
        Part.user_id == current_user.id,
    )
    if category:
        query = query.filter(Part.category == category)
    if status:
        query = query.filter(Part.status == status)

    return query.order_by(Part.created_at.desc()).all()


@router.post("", response_model=PartRead, status_code=201)
def create_part(
    car_id: int,
    payload: PartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)
    _validate_category(payload.category)
    _validate_status(payload.status)

    part = Part(
        car_id=car_id,
        user_id=current_user.id,
        name=payload.name,
        category=payload.category,
        brand=payload.brand,
        part_number=payload.part_number,
        quantity=payload.quantity,
        vendor=payload.vendor,
        cost=payload.cost,
        purchased_date=payload.purchased_date,
        installed_date=payload.installed_date,
        mileage=payload.mileage,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@router.get("/{part_id}", response_model=PartRead)
def get_part(
    car_id: int,
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)
    return _get_part_or_404(db, current_user, car_id, part_id)


@router.put("/{part_id}", response_model=PartRead)
def update_part(
    car_id: int,
    part_id: int,
    payload: PartUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)
    part = _get_part_or_404(db, current_user, car_id, part_id)

    data = payload.model_dump(exclude_unset=True)
    if "category" in data and data["category"] is not None:
        _validate_category(data["category"])
    if "status" in data and data["status"] is not None:
        _validate_status(data["status"])

    for field, value in data.items():
        setattr(part, field, value)

    db.commit()
    db.refresh(part)
    return part


@router.delete("/{part_id}")
def delete_part(
    car_id: int,
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)
    part = _get_part_or_404(db, current_user, car_id, part_id)

    db.delete(part)
    db.commit()
    return {"message": "Delen togs bort"}
