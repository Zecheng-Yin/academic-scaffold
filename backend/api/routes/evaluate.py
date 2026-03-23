from fastapi import APIRouter

from backend.models.evaluation import (
    EvaluationResponse,
    Step1EvaluateRequest,
    Step2EvaluateRequest,
    Step3EvaluateRequest,
    Step3EvaluationResponse,
)
from backend.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


@router.post("/{session_id}/step1", response_model=EvaluationResponse)
async def evaluate_step1(
    session_id: str,
    request: Step1EvaluateRequest,
) -> EvaluationResponse:
    return evaluation_service.evaluate_step1(session_id, request.answers)


@router.post("/{session_id}/step2", response_model=EvaluationResponse)
async def evaluate_step2(
    session_id: str,
    request: Step2EvaluateRequest,
) -> EvaluationResponse:
    return evaluation_service.evaluate_step2(session_id, request.answers)


@router.post("/{session_id}/step3", response_model=Step3EvaluationResponse)
async def evaluate_step3(
    session_id: str,
    request: Step3EvaluateRequest,
) -> Step3EvaluationResponse:
    return evaluation_service.evaluate_step3(session_id, request.full_text)
