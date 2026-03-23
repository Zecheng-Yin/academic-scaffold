from typing import Optional
from pydantic import BaseModel


class UploadResponse(BaseModel):
    session_id: str
    status: str  # "ready"
    title_hint: str  # first 100 chars of extracted text
    text_preview: str  # first 300 chars


class DocumentStatusResponse(BaseModel):
    session_id: str
    status: str  # "ready" | "processing" | "error"
    error_message: Optional[str] = None
