import json
from pathlib import Path


def load_phrasebank() -> list[dict]:
    """Load phrasebank.json, return list of {"text": str, "category": str} dicts."""
    path = Path(__file__).parent / "phrasebank.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    entries = []
    for cat in data["categories"]:
        for phrase in cat["phrases"]:
            entries.append({"text": phrase, "category": cat["name"]})
    return entries
