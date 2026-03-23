from typing import Optional
from pydantic import BaseModel


class ClozeItem(BaseModel):
    item_id: str
    # Step 1 fields
    sentence_skeleton: Optional[str] = None
    correct_facts: Optional[list[str]] = None
    blank_labels: Optional[list[str]] = None
    source_sentence: Optional[str] = None
    # Step 2 fields
    given_facts: Optional[str] = None
    sentence_with_blanks: Optional[str] = None
    chinese_prompt: Optional[str] = None
    correct_structure: Optional[list[str]] = None
    phrasebank_source: Optional[str] = None


class Step1Response(BaseModel):
    session_id: str
    items: list[ClozeItem]


class Step2Response(BaseModel):
    session_id: str
    items: list[ClozeItem]


class Step3Response(BaseModel):
    session_id: str
    chinese_outline: list[str]
