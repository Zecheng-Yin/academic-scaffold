from fastapi import APIRouter

from backend.models.scaffold import Step1Response, Step2Response, Step3Response
from backend.services.scaffold_service import scaffold_service

router = APIRouter(prefix="/scaffold", tags=["scaffold"])


@router.post("/{session_id}/step1/generate", response_model=Step1Response)
async def generate_step1(session_id: str) -> Step1Response:
    items = scaffold_service.generate_step1(session_id)
    return Step1Response(session_id=session_id, items=items)


@router.post("/{session_id}/step2/generate", response_model=Step2Response)
async def generate_step2(session_id: str) -> Step2Response:
    items = scaffold_service.generate_step2(session_id)
    return Step2Response(session_id=session_id, items=items)


@router.post("/{session_id}/step3/generate", response_model=Step3Response)
async def generate_step3(session_id: str) -> Step3Response:
    data = scaffold_service.generate_step3(session_id)
    return Step3Response(
        session_id=session_id,
        chinese_outline=data.get("chinese_outline", []),
    )
