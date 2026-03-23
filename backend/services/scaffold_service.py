import json
import anthropic
from datetime import datetime

from backend.core.config import get_settings
from backend.core.exceptions import AIServiceError, SessionNotFoundError, SessionExpiredError
from backend.core.session_store import session_store
from backend.services.rag_service import rag_service
from backend.prompts import step1_facts, step2_structure, step3_paraphrase


class ScaffoldService:
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
        """Call Claude API and return text content."""
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

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON from Claude response, handling markdown code blocks."""
        text = response_text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first line (```json or ```) and last line (```)
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise AIServiceError(f"Failed to parse AI response as JSON: {str(e)}")

    def generate_step1(self, session_id: str) -> list[dict]:
        """Generate Step 1 fill-in-the-facts cloze items."""
        session = self._get_valid_session(session_id)

        phrases = rag_service.retrieve_phrases(session.raw_text, k=8)
        user_prompt = step1_facts.USER_PROMPT.format(
            paper_excerpt=session.raw_text[:3000],
            retrieved_phrases="\n".join(phrases),
            num_items=5,
        )

        response_text = self._call_claude(step1_facts.SYSTEM_PROMPT, user_prompt)
        data = self._parse_json_response(response_text)
        items = data.get("items", [])

        session.step1_items = items
        return items

    def generate_step2(self, session_id: str) -> list[dict]:
        """Generate Step 2 fill-in-the-structure cloze items."""
        session = self._get_valid_session(session_id)

        phrases = rag_service.retrieve_phrases(session.raw_text, k=8)

        # Extract step1 sentences for context
        step1_sentences = []
        for item in session.step1_items:
            if item.get("source_sentence"):
                step1_sentences.append(item["source_sentence"])
        step1_context = "\n".join(f"- {s}" for s in step1_sentences) if step1_sentences else "No step 1 sentences available."

        user_prompt = step2_structure.USER_PROMPT.format(
            paper_excerpt=session.raw_text[:3000],
            step1_sentences=step1_context,
            retrieved_phrases="\n".join(phrases),
            num_items=5,
        )

        response_text = self._call_claude(step2_structure.SYSTEM_PROMPT, user_prompt)
        data = self._parse_json_response(response_text)
        items = data.get("items", [])

        session.step2_items = items
        return items

    def generate_step3(self, session_id: str) -> dict:
        """Generate Step 3 Chinese outline for guided retelling."""
        session = self._get_valid_session(session_id)

        phrases = rag_service.retrieve_phrases(session.raw_text, k=6)

        # Collect key sentences from steps 1 and 2
        step_sentences = []
        for item in session.step1_items:
            if item.get("source_sentence"):
                step_sentences.append(f"[Fact] {item['source_sentence']}")
        for item in session.step2_items:
            if item.get("given_facts"):
                step_sentences.append(f"[Structure] {item['given_facts']}")
        step_context = "\n".join(step_sentences) if step_sentences else "No previous steps available."

        user_prompt = step3_paraphrase.USER_PROMPT.format(
            paper_excerpt=session.raw_text[:3000],
            step_sentences=step_context,
            retrieved_phrases="\n".join(phrases),
        )

        response_text = self._call_claude(step3_paraphrase.SYSTEM_PROMPT, user_prompt)
        data = self._parse_json_response(response_text)

        chinese_outline = data.get("chinese_outline", [])
        key_points = data.get("key_points_for_evaluation", [])

        # Store key points in session for evaluation (not returned to client)
        session.step3_key_points = key_points
        session.step3_outline = {"chinese_outline": chinese_outline}

        return {"chinese_outline": chinese_outline}


scaffold_service = ScaffoldService()
