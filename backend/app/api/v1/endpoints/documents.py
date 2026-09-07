import logging
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.car_document import CarDocument
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.car_document import CarDocumentRead
from app.services.garage_service import verify_car_in_garage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cars/{car_id}/documents", tags=["documents"])

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/uploads"))

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

MAX_FILE_SIZE = 10 * 1024 * 1024

VALID_CATEGORIES = {
    "instruktionsbok",
    "servicebok",
    "reparationsmanual",
    "forsakringsdokument",
    "besiktningsprotokoll",
    "kvitton",
}


@router.get("", response_model=list[CarDocumentRead])
def list_documents(
    car_id: int,
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    query = db.query(CarDocument).filter(
        CarDocument.car_id == car_id,
        CarDocument.user_id == current_user.id,
    )
    if category:
        query = query.filter(CarDocument.category == category)

    return query.order_by(CarDocument.uploaded_at.desc()).all()


@router.post("", response_model=CarDocumentRead)
async def upload_document(
    car_id: int,
    category: str = Query(..., description="Document category"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Ogiltig kategori. Tillåtna: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Filtypen stöds inte. Tillåtna: PDF, bilder (JPG/PNG/WebP), Word-dokument, textfiler.",
        )

    try:
        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Filen är för stor (max 10 MB).")

        # Ensure upload directory exists
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        user_car_dir = UPLOAD_DIR / str(current_user.id) / str(car_id)
        user_car_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename).suffix if file.filename else ""
        stored_name = f"{uuid.uuid4().hex}{ext}"
        stored_path = user_car_dir / stored_name

        with open(stored_path, "wb") as f:
            f.write(contents)

        doc = CarDocument(
            car_id=car_id,
            user_id=current_user.id,
            category=category,
            filename=file.filename or "unknown",
            stored_path=str(stored_path),
            file_size=len(contents),
            mime_type=file.content_type or "application/octet-stream",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        return doc

    except HTTPException:
        raise
    except Exception:
        logger.exception("Document upload failed for car %s", car_id)
        raise HTTPException(status_code=500, detail="Uppladdning misslyckades.")


@router.get("/{doc_id}/preview")
def preview_document(
    car_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    doc = (
        db.query(CarDocument)
        .filter(
            CarDocument.id == doc_id,
            CarDocument.car_id == car_id,
            CarDocument.user_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumentet hittades inte")

    if not os.path.exists(doc.stored_path):
        raise HTTPException(status_code=404, detail="Filen saknas på servern")

    # Serve inline so the browser renders it instead of downloading
    return FileResponse(
        path=doc.stored_path,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f"inline; filename=\"{doc.filename}\""},
    )


@router.get("/{doc_id}/download")
def download_document(
    car_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    doc = (
        db.query(CarDocument)
        .filter(
            CarDocument.id == doc_id,
            CarDocument.car_id == car_id,
            CarDocument.user_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumentet hittades inte")

    if not os.path.exists(doc.stored_path):
        raise HTTPException(status_code=404, detail="Filen saknas på servern")

    return FileResponse(
        path=doc.stored_path,
        filename=doc.filename,
        media_type=doc.mime_type,
    )


@router.delete("/{doc_id}")
def delete_document(
    car_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_car_in_garage(db, current_user, car_id)

    doc = (
        db.query(CarDocument)
        .filter(
            CarDocument.id == doc_id,
            CarDocument.car_id == car_id,
            CarDocument.user_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumentet hittades inte")

    if os.path.exists(doc.stored_path):
        os.remove(doc.stored_path)

    db.delete(doc)
    db.commit()

    return {"message": "Dokumentet har tagits bort"}
