import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import get_settings
from backend.core.session_store import session_store
from backend.services.rag_service import rag_service
from backend.knowledge_base.phrasebank_loader import load_phrasebank
from backend.api.routes import document, scaffold, evaluate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _cleanup_sessions_loop():
    """Background task: evict expired sessions every 15 minutes."""
    while True:
        await asyncio.sleep(15 * 60)
        removed = session_store.cleanup()
        if removed:
            logger.info(f"Session cleanup: removed {removed} expired sessions.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Building phrasebank FAISS index...")
    try:
        phrases = load_phrasebank()
        rag_service.build_phrasebank_index(phrases)
        logger.info(f"Phrasebank index built with {len(phrases)} entries.")
    except Exception as e:
        logger.warning(f"Could not build phrasebank index: {e}. Continuing without it.")

    cleanup_task = asyncio.create_task(_cleanup_sessions_loop())
    logger.info("Background session cleanup task started.")

    yield

    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("Application shutdown complete.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Academic Scaffold API",
        description="Backend for the Academic Scaffold MVP",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers under /api prefix
    app.include_router(document.router, prefix="/api")
    app.include_router(scaffold.router, prefix="/api")
    app.include_router(evaluate.router, prefix="/api")

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
