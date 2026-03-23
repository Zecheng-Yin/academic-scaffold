from typing import Optional
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from backend.core.config import get_settings


class RAGService:
    def __init__(self):
        settings = get_settings()
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key,
        )
        self.phrasebank_index: Optional[FAISS] = None

    def build_phrasebank_index(self, phrases: list[dict]) -> None:
        """Build FAISS index from phrasebank entries.

        Each entry: {"text": str, "category": str}
        """
        if not phrases:
            return

        documents = [
            Document(
                page_content=entry["text"],
                metadata={"category": entry["category"]},
            )
            for entry in phrases
        ]

        self.phrasebank_index = FAISS.from_documents(documents, self.embeddings)

    def build_paper_index(self, text: str) -> FAISS:
        """Chunk text, embed, and return a FAISS index for a paper."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=50,
            length_function=len,
        )
        chunks = splitter.split_text(text)
        documents = [Document(page_content=chunk) for chunk in chunks]
        index = FAISS.from_documents(documents, self.embeddings)
        return index

    def retrieve_phrases(self, query: str, k: int = 5) -> list[str]:
        """Query phrasebank index, return list of phrase strings."""
        if self.phrasebank_index is None:
            return []

        results = self.phrasebank_index.similarity_search(query, k=k)
        return [doc.page_content for doc in results]

    def retrieve_paper_context(self, paper_index: FAISS, query: str, k: int = 3) -> str:
        """Query paper index, return concatenated relevant chunks."""
        results = paper_index.similarity_search(query, k=k)
        return "\n\n".join(doc.page_content for doc in results)


rag_service = RAGService()
