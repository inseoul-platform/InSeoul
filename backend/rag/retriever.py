"""
retriever.py — ChromaDB에서 관련 청크를 검색하는 RAG 검색기

싱글톤 패턴으로 SentenceTransformer 1회 로드.
임베딩 방식: ingestor.py와 동일한 paraphrase-multilingual-MiniLM-L12-v2
"""

import os
from typing import Optional

import chromadb
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "inseoul_knowledge"
DEFAULT_TOP_K = 4

_model: Optional[SentenceTransformer] = None
_client: Optional[chromadb.PersistentClient] = None
_collection = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model


def get_collection(chroma_dir: Optional[str] = None):
    global _client, _collection
    if _collection is None:
        if chroma_dir is None:
            chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectorstore")
        _client = chromadb.PersistentClient(path=chroma_dir)
        _collection = _client.get_collection(name=COLLECTION_NAME)
    return _collection


def retrieve(query: str, top_k: int = DEFAULT_TOP_K) -> list[dict]:
    """
    쿼리 텍스트를 임베딩하여 ChromaDB에서 유사도 상위 청크를 반환한다.

    Returns:
        List of {"content": str, "source": str, "section": str}
    """
    model = get_model()
    query_embedding = model.encode([query])[0].tolist()

    collection = get_collection()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"],
    )

    chunks = []
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    for doc, meta in zip(documents, metadatas):
        chunks.append({
            "content": doc,
            "source": meta.get("source", ""),
            "section": meta.get("section", ""),
        })

    return chunks
