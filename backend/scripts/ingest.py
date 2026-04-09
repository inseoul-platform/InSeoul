"""
scripts/ingest.py — 지식 베이스 ChromaDB 인제스트 실행 스크립트

실행 방법:
    cd backend
    python scripts/ingest.py

선택적으로 ChromaDB 저장 경로 지정:
    CHROMA_PERSIST_DIR=./vectorstore python scripts/ingest.py
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# backend/ 를 sys.path에 추가 (rag 패키지 임포트용)
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv(Path(__file__).parent.parent / ".env")

from rag.ingestor import ingest

if __name__ == "__main__":
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectorstore")
    print(f"ChromaDB 경로: {chroma_dir}")
    print("문서 로드 및 임베딩 시작...")

    count = ingest(chroma_dir=chroma_dir)

    print(f"\n{count}개 청크가 ChromaDB에 저장되었습니다.")
    print(f"컬렉션: inseoul_knowledge")
    print(f"경로: {chroma_dir}")
