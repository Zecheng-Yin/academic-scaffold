from typing import Optional
from pydantic import BaseModel


class AnswerItem(BaseModel):
    item_id: str
    user_input: str


class EvaluationItemResult(BaseModel):
    item_id: str
    semantic_score: int
    formality_score: int
    overall_score: int
    user_input: str
    reference_answer: str
    feedback_text: str
    suggested_phrases: list[str]


class EvaluationResponse(BaseModel):
    session_id: str
    step: int
    overall_score: int
    items: list[EvaluationItemResult]
    global_feedback: str


class Step1EvaluateRequest(BaseModel):
    answers: list[AnswerItem]


class Step2EvaluateRequest(BaseModel):
    answers: list[AnswerItem]


class Step3EvaluateRequest(BaseModel):
    full_text: str


class Step3EvaluationResponse(BaseModel):
    session_id: str
    step: int = 3
    overall_score: int
    semantic_score: int
    formality_score: int
    coverage_percentage: int
    covered_points: list[str]
    missing_points: list[str]
    formality_issues: list[dict]
    global_feedback: str
    annotated_text: str
