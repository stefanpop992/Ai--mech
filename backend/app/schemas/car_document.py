from datetime import datetime

from pydantic import BaseModel


class CarDocumentRead(BaseModel):
    id: int
    car_id: int
    category: str
    filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
