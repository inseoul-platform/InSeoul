"""
ingestor.py — knowledge/ 문서를 ChromaDB에 청킹·임베딩·저장

청킹 방식: ## 제목 기준 분할, 최대 500토큰, 50토큰 오버랩
임베딩: paraphrase-multilingual-MiniLM-L12-v2 (로컬)
컬렉션: inseoul_knowledge
"""

import os
import re
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"
COLLECTION_NAME = "inseoul_knowledge"
MAX_TOKENS = 500
OVERLAP_TOKENS = 50

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _model


def _rough_token_count(text: str) -> int:
    """단어 수 기반 토큰 수 추정 (한국어: 글자 수 / 2, 영문: 단어 수)"""
    korean_chars = len(re.findall(r"[\uac00-\ud7a3]", text))
    other_words = len(re.findall(r"[a-zA-Z0-9]+", text))
    return korean_chars // 2 + other_words


def _split_by_heading(content: str) -> list[dict]:
    """## 제목 기준으로 섹션 분할 반환"""
    sections = []
    # ## 또는 ### 제목 기준 분할 (# 최상위 제목 제외)
    parts = re.split(r"\n(?=#{2,3}\s)", content)

    for part in parts:
        part = part.strip()
        if not part:
            continue
        # 제목 추출
        heading_match = re.match(r"^(#{2,3})\s+(.+)", part)
        if heading_match:
            section_title = heading_match.group(2).strip()
        else:
            section_title = "intro"
        sections.append({"title": section_title, "content": part})

    return sections


def _chunk_section(section: dict, source: str) -> list[dict]:
    """섹션을 최대 MAX_TOKENS 기준으로 청킹 (오버랩 포함)"""
    chunks = []
    content = section["content"]
    title = section["title"]

    # 단락 단위로 먼저 분할
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    current_chunk = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = _rough_token_count(para)

        if current_tokens + para_tokens > MAX_TOKENS and current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            chunks.append({
                "content": chunk_text,
                "source": source,
                "section": title,
            })
            # 오버랩: 마지막 단락 유지
            overlap_paras = []
            overlap_tokens = 0
            for p in reversed(current_chunk):
                t = _rough_token_count(p)
                if overlap_tokens + t <= OVERLAP_TOKENS:
                    overlap_paras.insert(0, p)
                    overlap_tokens += t
                else:
                    break
            current_chunk = overlap_paras
            current_tokens = overlap_tokens

        current_chunk.append(para)
        current_tokens += para_tokens

    if current_chunk:
        chunk_text = "\n\n".join(current_chunk)
        chunks.append({
            "content": chunk_text,
            "source": source,
            "section": title,
        })

    return chunks


def load_and_chunk_documents() -> list[dict]:
    """knowledge/ 디렉터리의 모든 Markdown 문서를 로드해 청킹"""
    all_chunks = []

    md_files = list(KNOWLEDGE_DIR.glob("*.md"))
    if not md_files:
        raise FileNotFoundError(f"knowledge/ 디렉터리에 .md 파일이 없습니다: {KNOWLEDGE_DIR}")

    for md_file in sorted(md_files):
        source = md_file.name
        content = md_file.read_text(encoding="utf-8")
        sections = _split_by_heading(content)

        for section in sections:
            chunks = _chunk_section(section, source)
            all_chunks.extend(chunks)

    return all_chunks


def ingest(chroma_dir: str | None = None) -> int:
    """
    knowledge/ 문서를 ChromaDB에 인제스트한다.

    Returns:
        저장된 청크 수
    """
    if chroma_dir is None:
        chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectorstore")

    # 청킹
    chunks = load_and_chunk_documents()
    if not chunks:
        return 0

    # 임베딩 모델 로드
    model = get_model()
    texts = [c["content"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)

    # ChromaDB 저장
    client = chromadb.PersistentClient(path=chroma_dir)

    # 기존 컬렉션 삭제 후 재생성 (재인제스트 시 중복 방지)
    existing = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing:
        client.delete_collection(COLLECTION_NAME)

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": c["source"], "section": c["section"]} for c in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings.tolist(),
        documents=texts,
        metadatas=metadatas,
    )

    return len(chunks)
