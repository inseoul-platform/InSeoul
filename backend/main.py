import os
from contextlib import asynccontextmanager

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.health import router as health_router
from api.chat import router as chat_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작: ChromaDB 컬렉션 로드 확인
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./vectorstore")
    try:
        client = chromadb.PersistentClient(path=chroma_dir)
        collections = client.list_collections()
        print(f"[startup] ChromaDB 로드 완료 - 컬렉션 {len(collections)}개")
    except Exception as e:
        print(f"[startup] ChromaDB 초기화 건너뜀 (인제스트 전): {type(e).__name__}")
    yield
    # 앱 종료 시 처리 없음


app = FastAPI(title="InSeoul Chatbot API", version="1.0.0", lifespan=lifespan)

# CORS 설정
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS", "http://127.0.0.1:5500,http://localhost:5173"
)
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health_router)
app.include_router(chat_router)
