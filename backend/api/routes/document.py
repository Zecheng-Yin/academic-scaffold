import io
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime

from backend.core.config import get_settings
from backend.core.exceptions import PDFParseError, SessionNotFoundError, SessionExpiredError
from backend.core.session_store import session_store
from backend.models.document import DocumentStatusResponse, UploadResponse
from backend.services.pdf_parser import extract_abstract_intro
from backend.services.rag_service import rag_service

router = APIRouter(prefix="/document", tags=["document"])


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    settings = get_settings()

    # Validate file type
    if file.content_type not in ("application/pdf",) and not (
        file.filename and file.filename.lower().endswith(".pdf")
    ):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Read file bytes
    pdf_bytes = await file.read()

    # Validate file size
    max_bytes = settings.max_pdf_size_mb * 1024 * 1024
    if len(pdf_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_pdf_size_mb} MB.",
        )

    # Extract text from PDF
    try:
        parsed = extract_abstract_intro(pdf_bytes)
    except Exception as e:
        raise PDFParseError(str(e))

    raw_text = parsed.get("combined") or parsed.get("full_text", "")
    if not raw_text.strip():
        raise PDFParseError("Could not extract text from the PDF. Ensure the file contains readable text.")

    # Build paper FAISS index
    try:
        paper_index = rag_service.build_paper_index(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build knowledge index: {str(e)}")

    # Create session
    session = session_store.create(
        pdf_bytes=pdf_bytes,
        raw_text=raw_text,
        paper_faiss_index=paper_index,
        ttl_hours=settings.session_ttl_hours,
    )

    title_hint = raw_text[:100].replace("\n", " ").strip()
    text_preview = raw_text[:300].replace("\n", " ").strip()

    return UploadResponse(
        session_id=session.session_id,
        status="ready",
        title_hint=title_hint,
        text_preview=text_preview,
    )


@router.get("/{session_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(session_id: str) -> DocumentStatusResponse:
    session = session_store.get(session_id)

    if session is None:
        raise SessionNotFoundError(session_id)

    if session.expires_at < datetime.utcnow():
        raise SessionExpiredError(session_id)

    return DocumentStatusResponse(
        session_id=session_id,
        status="ready",
    )


@router.get("/{session_id}/pdf")
async def get_pdf(session_id: str) -> StreamingResponse:
    session = session_store.get(session_id)

    if session is None:
        raise SessionNotFoundError(session_id)

    if session.expires_at < datetime.utcnow():
        raise SessionExpiredError(session_id)

    return StreamingResponse(
        io.BytesIO(session.pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=document_{session_id}.pdf",
            "Content-Length": str(len(session.pdf_bytes)),
        },
    )
