import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import COOKIE_NAME, get_current_user
from app.db.models.car import Car
from app.db.models.garage_car import GarageCar
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

    # Bulk deletion lets database ON DELETE CASCADE remove only this user's
    # records, without ORM backrefs trying to null non-nullable foreign keys.
    garage = current_user.garage
    car_ids = []
    if garage:
        car_ids = [row.car_id for row in db.query(GarageCar).filter(
            GarageCar.garage_id == garage.id
        ).all()]
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    if car_ids:
        db.query(Car).filter(
            Car.id.in_(car_ids),
            ~Car.garages.any(),
        ).delete(synchronize_session=False)
    db.commit()

    # Files are removed only after the database transaction succeeds.
    user_upload_dir = UPLOAD_DIR / str(user_id)
    if user_upload_dir.exists():
        shutil.rmtree(user_upload_dir, ignore_errors=True)
    for ext in (".jpg", ".png"):
        (PROFILES_DIR / f"{user_id}{ext}").unlink(missing_ok=True)

    # Clear session cookie
    response.delete_cookie(key=COOKIE_NAME, path="/")

    return {"message": "Kontot har raderats"}
