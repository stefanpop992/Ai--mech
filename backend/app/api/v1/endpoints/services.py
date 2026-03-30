import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.models.car import Car
from app.db.models.garage_car import GarageCar
from app.db.models.service_log import ServiceLog, ServiceLogImage, ServiceLogItem
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.service_log import (
    ServiceLogCreate,
    ServiceLogImageRead,
    ServiceLogRead,
    ServiceLogSummary,
    ServiceLogUpdate,
)
from app.services.garage_service import get_or_create_garage

router = APIRouter(prefix="/cars/{car_id}/services", tags=["services"])

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/uploads"))

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

VALID_CATEGORIES = {
    "fluids_oil",
    "filters",
    "brakes",
    "tires_wheels",
    "engine_drivetrain",
    "suspension",
    "electrical",
    "other",
}


# ── Helpers ────────────────────────────────────────────────────────────────────


def _verify_car_in_garage(db: Session, user: User, car_id: int) -> Car:
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


def _get_service_or_404(
    db: Session, user: User, car_id: int, service_id: int
) -> ServiceLog:
    service = (
        db.query(ServiceLog)
        .options(joinedload(ServiceLog.items), joinedload(ServiceLog.images))
        .filter(
            ServiceLog.id == service_id,
            ServiceLog.car_id == car_id,
            ServiceLog.user_id == user.id,
        )
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Servicen hittades inte")
    return service


def _to_summary(s: ServiceLog) -> ServiceLogSummary:
    categories = list({item.category for item in s.items})
    return ServiceLogSummary(
        id=s.id,
        car_id=s.car_id,
        service_date=s.service_date,
        mileage=s.mileage,
        workshop=s.workshop,
        cost=s.cost,
        item_count=len(s.items),
        image_count=len(s.images),
        categories=categories,
        created_at=s.created_at,
    )


# ── CRUD ───────────────────────────────────────────────────────────────────────


@router.get("", response_model=list[ServiceLogSummary])
def list_services(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)

    services = (
        db.query(ServiceLog)
        .options(joinedload(ServiceLog.items), joinedload(ServiceLog.images))
        .filter(ServiceLog.car_id == car_id, ServiceLog.user_id == current_user.id)
        .order_by(ServiceLog.service_date.desc())
        .all()
    )
    # Deduplicate (joinedload kan skapa dubbetter)
    seen = set()
    unique = []
    for s in services:
        if s.id not in seen:
            seen.add(s.id)
            unique.append(s)

    return [_to_summary(s) for s in unique]


@router.post("", response_model=ServiceLogRead, status_code=201)
def create_service(
    car_id: int,
    payload: ServiceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)

    # Validate categories
    for item in payload.items:
        if item.category not in VALID_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Ogiltig kategori: {item.category}",
            )

    service = ServiceLog(
        car_id=car_id,
        user_id=current_user.id,
        service_date=payload.service_date,
        mileage=payload.mileage,
        workshop=payload.workshop,
        cost=payload.cost,
        notes=payload.notes,
    )
    db.add(service)
    db.flush()  # get service.id

    for item_data in payload.items:
        item = ServiceLogItem(
            service_log_id=service.id,
            category=item_data.category,
            label=item_data.label,
            checked=item_data.checked,
        )
        db.add(item)

    db.commit()
    db.refresh(service)
    return service


@router.get("/{service_id}", response_model=ServiceLogRead)
def get_service(
    car_id: int,
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)
    return _get_service_or_404(db, current_user, car_id, service_id)


@router.put("/{service_id}", response_model=ServiceLogRead)
def update_service(
    car_id: int,
    service_id: int,
    payload: ServiceLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)
    service = _get_service_or_404(db, current_user, car_id, service_id)

    if payload.service_date is not None:
        service.service_date = payload.service_date
    if payload.mileage is not None:
        service.mileage = payload.mileage
    if payload.workshop is not None:
        service.workshop = payload.workshop
    if payload.cost is not None:
        service.cost = payload.cost
    if payload.notes is not None:
        service.notes = payload.notes

    # Replace items if provided
    if payload.items is not None:
        for item_data in payload.items:
            if item_data.category not in VALID_CATEGORIES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ogiltig kategori: {item_data.category}",
                )

        # Delete old items
        db.query(ServiceLogItem).filter(
            ServiceLogItem.service_log_id == service.id
        ).delete()

        for item_data in payload.items:
            item = ServiceLogItem(
                service_log_id=service.id,
                category=item_data.category,
                label=item_data.label,
                checked=item_data.checked,
            )
            db.add(item)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(
    car_id: int,
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)
    service = _get_service_or_404(db, current_user, car_id, service_id)

    # Remove image files from disk
    for img in service.images:
        if os.path.exists(img.stored_path):
            os.remove(img.stored_path)

    db.delete(service)
    db.commit()
    return {"message": "Servicen har tagits bort"}


# ── Images ─────────────────────────────────────────────────────────────────────


@router.post(
    "/{service_id}/images",
    response_model=ServiceLogImageRead,
    status_code=201,
)
async def upload_service_image(
    car_id: int,
    service_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)
    service = _get_service_or_404(db, current_user, car_id, service_id)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Bara bilder tillåtna (JPG, PNG, WebP).",
        )

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Bilden är för stor (max 10 MB).")

    img_dir = UPLOAD_DIR / "services" / str(current_user.id) / str(car_id)
    img_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix if file.filename else ".jpg"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = img_dir / stored_name

    with open(stored_path, "wb") as f:
        f.write(contents)

    image = ServiceLogImage(
        service_log_id=service.id,
        filename=file.filename or "bild.jpg",
        stored_path=str(stored_path),
        file_size=len(contents),
        mime_type=file.content_type or "image/jpeg",
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.get("/{service_id}/images/{image_id}/preview")
def preview_service_image(
    car_id: int,
    service_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)

    image = (
        db.query(ServiceLogImage)
        .join(ServiceLog)
        .filter(
            ServiceLogImage.id == image_id,
            ServiceLog.id == service_id,
            ServiceLog.car_id == car_id,
            ServiceLog.user_id == current_user.id,
        )
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Bilden hittades inte")
    if not os.path.exists(image.stored_path):
        raise HTTPException(status_code=404, detail="Filen saknas på servern")

    return FileResponse(
        path=image.stored_path,
        media_type=image.mime_type,
        headers={"Content-Disposition": f'inline; filename="{image.filename}"'},
    )


@router.delete("/{service_id}/images/{image_id}")
def delete_service_image(
    car_id: int,
    service_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_car_in_garage(db, current_user, car_id)

    image = (
        db.query(ServiceLogImage)
        .join(ServiceLog)
        .filter(
            ServiceLogImage.id == image_id,
            ServiceLog.id == service_id,
            ServiceLog.car_id == car_id,
            ServiceLog.user_id == current_user.id,
        )
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Bilden hittades inte")

    if os.path.exists(image.stored_path):
        os.remove(image.stored_path)

    db.delete(image)
    db.commit()
    return {"message": "Bilden har tagits bort"}
