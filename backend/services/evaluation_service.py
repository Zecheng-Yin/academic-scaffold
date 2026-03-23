import json
import anthropic
from datetime import datetime

from backend.core.config import get_settings
from backend.core.exceptions import AIServiceError, SessionNotFoundError, SessionExpiredError
from backend.core.session_store import session_store
from backend.models.evaluation import (
    AnswerItem,
    EvaluationItemResult,
    EvaluationResponse,
    Step3EvaluationResponse,
)
from backend.services.rag_service import rag_service
from backend.prompts import evaluation as eval_prompts


class EvaluationService:
    def __init__(self):
        settings = get_settings()
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model

    def _get_valid_session(self, session_id: str):
        session = session_store.get(session_id)
        if session is None:
            raise SessionNotFoundError(session_id)
        if session.expires_at < datetime.utcnow():
            raise SessionExpiredError(session_id)
        return session

    def _call_claude(self, system: str, user: str) -> str:
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return message.content[0].text
        except anthropic.APIError as e:
            raise AIServiceError(f"Claude API error: {str(e)}")
        except Exception as e:
            raise AIServiceError(f"Unexpected error calling AI service: {str(e)}")

    def _parse_json(self, response_text: str) -> dict:
        text = response_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise AIServiceError(f"Failed to parse AI evaluation response: {str(e)}")

    def _run_semantic_evaluation(
        self,
        answer_pairs: list[dict],
    ) -> dict[str, dict]:
        """Run Layer 1 semantic accuracy evaluation."""
        pairs_text = "\n\n".join(
            f"Item {p['item_id']}:\n  Reference: {p['reference']}\n  Learner: {p['user_input']}"
            for p in answer_pairs
        )
        user_prompt = eval_prompts.SEMANTIC_USER.format(answer_pairs=pairs_text)
        response_text = self._call_claude(eval_prompts.SEMANTIC_SYSTEM, user_prompt)
        data = self._parse_json(response_text)
        evaluations = data.get("evaluations", [])
        return {e["item_id"]: e for e in evaluations}

    def _run_formality_evaluation(
        self,
        answers: list[dict],
        phrasebank_phrases: list[str],
    ) -> dict[str, dict]:
        """Run Layer 2 formality check."""
        answers_text = "\n\n".join(
            f"Item {a['item_id']}: {a['user_input']}"
            for a in answers
        )
        phrases_text = "\n".join(f"- {p}" for p in phrasebank_phrases)
        user_prompt = eval_prompts.FORMALITY_USER.format(
            answers=answers_text,
            phrasebank_phrases=phrases_text,
        )
        response_text = self._call_claude(eval_prompts.FORMALITY_SYSTEM, user_prompt)
        data = self._parse_json(response_text)
        evaluations = data.get("evaluations", [])
        return {e["item_id"]: e for e in evaluations}

    def _build_answer_pairs(
        self,
        answers: list[AnswerItem],
        reference_items: list[dict],
        ref_answer_key: str,
    ) -> tuple[list[dict], list[dict]]:
        """Build answer pairs and user answer dicts."""
        ref_map = {item.get("item_id"): item for item in reference_items}
        answer_pairs = []
        user_answers = []

        for answer in answers:
            ref = ref_map.get(answer.item_id, {})
            ref_answer = ref.get(ref_answer_key, ["(no reference)"])
            if isinstance(ref_answer, list):
                ref_answer_str = "; ".join(ref_answer)
            else:
                ref_answer_str = str(ref_answer)

            answer_pairs.append({
                "item_id": answer.item_id,
                "reference": ref_answer_str,
                "user_input": answer.user_input,
            })
            user_answers.append({
                "item_id": answer.item_id,
                "user_input": answer.user_input,
            })

        return answer_pairs, user_answers

    def evaluate_step1(
        self,
        session_id: str,
        answers: list[AnswerItem],
    ) -> EvaluationResponse:
        """Evaluate Step 1 fill-in-the-facts answers."""
        session = self._get_valid_session(session_id)

        answer_pairs, user_answers = self._build_answer_pairs(
            answers,
            session.step1_items,
            "correct_facts",
        )

        # Layer 1: Semantic evaluation
        semantic_results = self._run_semantic_evaluation(answer_pairs)

        # Layer 2: Formality evaluation
        phrases = rag_service.retrieve_phrases(
            " ".join(a.user_input for a in answers), k=10
        )
        formality_results = self._run_formality_evaluation(user_answers, phrases)

        ref_map = {item.get("item_id"): item for item in session.step1_items}
        result_items = []
        total_score = 0

        for answer in answers:
            sem = semantic_results.get(answer.item_id, {})
            form = formality_results.get(answer.item_id, {})

            semantic_score = sem.get("semantic_score", 50)
            formality_score = form.get("formality_score", 50)
            overall_score = round(0.6 * semantic_score + 0.4 * formality_score)

            ref = ref_map.get(answer.item_id, {})
            ref_facts = ref.get("correct_facts", [])
            reference_answer = "; ".join(ref_facts) if ref_facts else "(no reference)"

            result_items.append(
                EvaluationItemResult(
                    item_id=answer.item_id,
                    semantic_score=semantic_score,
                    formality_score=formality_score,
                    overall_score=overall_score,
                    user_input=answer.user_input,
                    reference_answer=reference_answer,
                    feedback_text=sem.get("feedback", "Keep practicing!"),
                    suggested_phrases=form.get("suggested_phrases", []),
                )
            )
            total_score += overall_score

        overall = round(total_score / len(result_items)) if result_items else 0
        global_feedback = self._generate_global_feedback(overall, "Step 1 (Facts)")

        return EvaluationResponse(
            session_id=session_id,
            step=1,
            overall_score=overall,
            items=result_items,
            global_feedback=global_feedback,
        )

    def evaluate_step2(
        self,
        session_id: str,
        answers: list[AnswerItem],
    ) -> EvaluationResponse:
        """Evaluate Step 2 fill-in-the-structure answers."""
        session = self._get_valid_session(session_id)

        answer_pairs, user_answers = self._build_answer_pairs(
            answers,
            session.step2_items,
            "correct_structure",
        )

        # Layer 1: Semantic evaluation
        semantic_results = self._run_semantic_evaluation(answer_pairs)

        # Layer 2: Formality evaluation
        phrases = rag_service.retrieve_phrases(
            " ".join(a.user_input for a in answers), k=10
        )
        formality_results = self._run_formality_evaluation(user_answers, phrases)

        ref_map = {item.get("item_id"): item for item in session.step2_items}
        result_items = []
        total_score = 0

        for answer in answers:
            sem = semantic_results.get(answer.item_id, {})
            form = formality_results.get(answer.item_id, {})

            semantic_score = sem.get("semantic_score", 50)
            formality_score = form.get("formality_score", 50)
            overall_score = round(0.6 * semantic_score + 0.4 * formality_score)

            ref = ref_map.get(answer.item_id, {})
            ref_struct = ref.get("correct_structure", [])
            reference_answer = "; ".join(ref_struct) if ref_struct else "(no reference)"

            result_items.append(
                EvaluationItemResult(
                    item_id=answer.item_id,
                    semantic_score=semantic_score,
                    formality_score=formality_score,
                    overall_score=overall_score,
                    user_input=answer.user_input,
                    reference_answer=reference_answer,
                    feedback_text=sem.get("feedback", "Keep practicing!"),
                    suggested_phrases=form.get("suggested_phrases", []),
                )
            )
            total_score += overall_score

        overall = round(total_score / len(result_items)) if result_items else 0
        global_feedback = self._generate_global_feedback(overall, "Step 2 (Structure)")

        return EvaluationResponse(
            session_id=session_id,
            step=2,
            overall_score=overall,
            items=result_items,
            global_feedback=global_feedback,
        )

    def evaluate_step3(
        self,
        session_id: str,
        full_text: str,
    ) -> Step3EvaluationResponse:
        """Evaluate Step 3 full retelling submission."""
        session = self._get_valid_session(session_id)

        key_points = session.step3_key_points
        if not key_points:
            key_points = ["The paper addresses an important research problem.",
                          "A novel method was proposed.",
                          "Experiments demonstrated significant results."]

        key_points_text = "\n".join(f"{i+1}. {point}" for i, point in enumerate(key_points))
        phrases = rag_service.retrieve_phrases(full_text, k=12)
        phrases_text = "\n".join(f"- {p}" for p in phrases)

        user_prompt = eval_prompts.STEP3_HOLISTIC_USER.format(
            key_points=key_points_text,
            learner_text=full_text,
            phrasebank_phrases=phrases_text,
        )

        response_text = self._call_claude(eval_prompts.STEP3_HOLISTIC_SYSTEM, user_prompt)
        data = self._parse_json(response_text)

        semantic_score = data.get("semantic_score", 50)
        formality_score = data.get("formality_score", 50)
        overall_score = round(0.6 * semantic_score + 0.4 * formality_score)

        covered_points = data.get("covered_points", [])
        missing_points = data.get("missing_points", [])
        total_points = len(covered_points) + len(missing_points)
        coverage_pct = round(len(covered_points) / total_points * 100) if total_points > 0 else 0

        formality_issues = data.get("formality_issues", [])
        global_feedback = data.get("global_feedback", "Good effort! Keep practicing academic writing.")
        annotated_text = data.get("annotated_text", full_text)

        return Step3EvaluationResponse(
            session_id=session_id,
            step=3,
            overall_score=overall_score,
            semantic_score=semantic_score,
            formality_score=formality_score,
            coverage_percentage=coverage_pct,
            covered_points=covered_points,
            missing_points=missing_points,
            formality_issues=formality_issues,
            global_feedback=global_feedback,
            annotated_text=annotated_text,
        )

    def _generate_global_feedback(self, score: int, step_name: str) -> str:
        if score >= 90:
            return (
                f"Excellent work on {step_name}! Your answers demonstrate strong comprehension "
                "and excellent use of academic language. Keep up the great work!"
            )
        elif score >= 75:
            return (
                f"Good job on {step_name}! You have a solid understanding of the material. "
                "Review the suggestions for a few items to further refine your academic writing."
            )
        elif score >= 60:
            return (
                f"Fair effort on {step_name}. You are on the right track! Focus on the items "
                "that need improvement and pay attention to using more formal academic vocabulary."
            )
        else:
            return (
                f"Keep practicing {step_name}! Review the reference answers carefully and try "
                "to use the suggested academic phrases to improve both accuracy and formality. "
                "You'll improve with consistent practice."
            )


evaluation_service = EvaluationService()
