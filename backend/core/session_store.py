from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Optional
import threading
import uuid


@dataclass
class SessionData:
    session_id: str
    pdf_bytes: bytes
    raw_text: str
    paper_faiss_index: Any  # FAISS VectorStore
    step1_items: list = field(default_factory=list)
    step2_items: list = field(default_factory=list)
    step3_outline: Optional[dict] = None
    step3_key_points: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=2))


class SessionStore:
    def __init__(self):
        self._store: dict[str, SessionData] = {}
        self._lock = threading.Lock()

    def create(
        self,
        pdf_bytes: bytes,
        raw_text: str,
        paper_faiss_index: Any,
        ttl_hours: int = 2,
    ) -> SessionData:
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        session = SessionData(
            session_id=session_id,
            pdf_bytes=pdf_bytes,
            raw_text=raw_text,
            paper_faiss_index=paper_faiss_index,
            expires_at=now + timedelta(hours=ttl_hours),
            created_at=now,
        )
        with self._lock:
            self._store[session_id] = session
        return session

    def get(self, session_id: str) -> Optional[SessionData]:
        with self._lock:
            return self._store.get(session_id)

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._store.pop(session_id, None)

    def cleanup(self) -> int:
        now = datetime.utcnow()
        to_remove = []
        with self._lock:
            for sid, session in self._store.items():
                if session.expires_at < now:
                    to_remove.append(sid)
            for sid in to_remove:
                del self._store[sid]
        return len(to_remove)

    def count(self) -> int:
        with self._lock:
            return len(self._store)


session_store = SessionStore()
