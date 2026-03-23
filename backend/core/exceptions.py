from fastapi import HTTPException


class SessionNotFoundError(HTTPException):
    def __init__(self, session_id: str):
        super().__init__(
            status_code=404,
            detail=f"Session '{session_id}' not found.",
        )


class PDFParseError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=422,
            detail=f"PDF parse error: {detail}",
        )


class AIServiceError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=503,
            detail=f"AI service error: {detail}",
        )


class SessionExpiredError(HTTPException):
    def __init__(self, session_id: str):
        super().__init__(
            status_code=410,
            detail=f"Session '{session_id}' has expired.",
        )
