import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import COOKIE_NAME, get_current_user
from app.db.models.car import Car
from app.db.models.car_document import CarDocument
from app.db.models.garage_car import GarageCar
from app.db.models.session import Session as DBSession
from app.db.models.user import User
from app.db.session import get_db

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/uploads"))
PROFILES_DIR = UPLOAD_DIR / "profiles"

ALLOWED_PROFILE_MIME = {"image/jpeg", "image/png"}
MAX_PROFILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_PROFILE_MIME:
        raise HTTPException(status_code=400, detail="Endast JPG och PNG är tillåtna")

    contents = await file.read()
    if len(contents) > MAX_PROFILE_SIZE:
        raise HTTPException(status_code=400, detail="Bilden är för stor (max 5 MB)")

    PROFILES_DIR.mkdir(parents=True, exist_ok=True)

    ext = ".jpg" if file.content_type == "image/jpeg" else ".png"
    stored_path = PROFILES_DIR / f"{current_user.id}{ext}"

    # Remove old profile picture with different extension
    for old_ext in (".jpg", ".png"):
        old_path = PROFILES_DIR / f"{current_user.id}{old_ext}"
        if old_path != stored_path and old_path.exists():
            old_path.unlink()

    with open(stored_path, "wb") as f:
        f.write(contents)

    current_user.profile_picture = str(stored_path)
    db.commit()

    return {"profile_picture_url": f"/api/v1/users/me/profile-picture"}


@router.get("/me/profile-picture")
def get_profile_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.profile_picture or not os.path.exists(current_user.profile_picture):
        raise HTTPException(status_code=404, detail="Ingen profilbild uppladdad")

    ext = Path(current_user.profile_picture).suffix.lower()
    media_type = "image/jpeg" if ext == ".jpg" else "image/png"

    return FileResponse(
        path=current_user.profile_picture,
        media_type=media_type,
        headers={"Cache-Control": "no-cache"},
    )


@router.delete("/me")
def delete_account(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    # Delete all uploaded files from disk for this user
    user_upload_dir = UPLOAD_DIR / str(user_id)
    if user_upload_dir.exists():
        shutil.rmtree(user_upload_dir, ignore_errors=True)

    # Delete profile picture
    for ext in (".jpg", ".png"):
        profile_path = PROFILES_DIR / f"{user_id}{ext}"
        if profile_path.exists():
            profile_path.unlink(missing_ok=True)

    # Delete cars owned by this user (via garage)
    garage = current_user.garage
    if garage:
        car_links = db.query(GarageCar).filter(GarageCar.garage_id == garage.id).all()
        car_ids = [link.car_id for link in car_links]
        for car_id in car_ids:
            db.query(Car).filter(Car.id == car_id).delete()

    # Delete all sessions
    db.query(DBSession).filter(DBSession.user_id == user_id).delete()

    # Delete user (cascades to garage, garage_cars, car_documents)
    db.delete(current_user)
    db.commit()

    # Clear session cookie
    response.delete_cookie(key=COOKIE_NAME, path="/")

    return {"message": "Kontot har raderats"}
