import re
from typing import Optional
import fitz  # PyMuPDF


def _sort_blocks_by_position(blocks: list) -> list:
    """Sort text blocks by their position, handling two-column layouts."""
    # Get page width from first block if available
    if not blocks:
        return blocks

    # Sort primarily by vertical position (top), secondarily by horizontal (left)
    # For two-column layouts, cluster by left position first
    sorted_blocks = sorted(blocks, key=lambda b: (round(b[1] / 20), b[0]))
    return sorted_blocks


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from PDF, handling two-column layouts."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text_parts = []

    for page in doc:
        blocks = page.get_text("blocks")
        sorted_blocks = _sort_blocks_by_position(blocks)
        page_text = "\n".join(b[4] for b in sorted_blocks if b[4].strip())
        full_text_parts.append(page_text)

    doc.close()
    return "\n\n".join(full_text_parts)


def _find_section(text: str, section_name: str, next_section_patterns: list[str]) -> Optional[str]:
    """Find a section in the text and extract its content."""
    # Build pattern that matches section header
    header_pattern = re.compile(
        r'(?:^|\n)\s*(?:\d+\.?\s+|[IVX]+\.?\s+)?'
        + re.escape(section_name)
        + r'\s*\n',
        re.IGNORECASE,
    )

    match = header_pattern.search(text)
    if not match:
        # Try simpler match
        simple_pattern = re.compile(
            r'(?:^|\n)\s*' + re.escape(section_name) + r'\s*[\n:]',
            re.IGNORECASE,
        )
        match = simple_pattern.search(text)

    if not match:
        return None

    start = match.end()
    content = text[start:]

    # Find where the next section begins
    end = len(content)
    for pattern_str in next_section_patterns:
        nxt = re.search(pattern_str, content, re.IGNORECASE | re.MULTILINE)
        if nxt and nxt.start() < end:
            end = nxt.start()

    section_text = content[:end].strip()
    return section_text if section_text else None


def extract_abstract_intro(pdf_bytes: bytes) -> dict:
    """
    Extract text from PDF, focusing on Abstract and Introduction sections.

    Returns:
        dict with keys: abstract, introduction, combined, num_pages
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    num_pages = len(doc)
    doc.close()

    full_text = _extract_text_from_pdf(pdf_bytes)

    # Patterns for section endings (next section indicators)
    next_section_after_abstract = [
        r'^\s*(?:\d+\.?\s+)?(?:introduction|keywords|key\s*words)\s*$',
        r'^\s*1\.?\s+introduction\s*$',
        r'^\s*[IVX]+\.?\s+introduction\s*$',
    ]

    next_section_after_intro = [
        r'^\s*2\.?\s+\w',
        r'^\s*II\.?\s+\w',
        r'^\s*(?:related\s+work|background|methodology|methods|literature\s+review)\s*$',
    ]

    abstract_text = _find_section(full_text, "abstract", next_section_after_abstract)
    introduction_text = _find_section(full_text, "introduction", next_section_after_intro)

    # Fallback: use first 2000 chars if sections not found
    fallback_text = full_text[:2000]

    if not abstract_text:
        # Try to find abstract inline (e.g., "Abstract—" or "Abstract:")
        inline_match = re.search(r'abstract[—:\-]\s*(.*?)(?:\n\n|\Z)', full_text, re.IGNORECASE | re.DOTALL)
        if inline_match:
            abstract_text = inline_match.group(1).strip()[:1500]
        else:
            abstract_text = fallback_text

    if not introduction_text:
        introduction_text = fallback_text

    # Combine abstract and introduction for embeddings
    combined_parts = []
    if abstract_text:
        combined_parts.append(f"Abstract:\n{abstract_text}")
    if introduction_text:
        combined_parts.append(f"Introduction:\n{introduction_text}")

    combined = "\n\n".join(combined_parts) if combined_parts else full_text[:4000]

    return {
        "abstract": abstract_text or "",
        "introduction": introduction_text or "",
        "combined": combined,
        "num_pages": num_pages,
        "full_text": full_text,
    }
