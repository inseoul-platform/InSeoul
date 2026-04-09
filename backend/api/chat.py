"""
api/chat.py — POST /chat SSE 스트리밍 엔드포인트

요청:
  {
    "message": "질문 텍스트",
    "history": [{"role": "user"|"assistant", "content": "..."}],
    "context": {
      "page": "/dashboard",
      "userProfile": {"cash": 5000, "monthlySavings": 300, ...},
      "simConfig": {"ltvRatio": 0.5, "apartmentAnnualRise": 3, ...}
    }
  }

SSE 응답 형식:
  data: {"type": "delta", "content": "텍스트 청크"}
  data: {"type": "done"}
  data: {"type": "error", "message": "오류 내용"}
"""

import json
from typing import Any, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag.chain import stream_chat

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatContext(BaseModel):
    page: Optional[str] = ""
    userProfile: Optional[dict[str, Any]] = {}
    simConfig: Optional[dict[str, Any]] = {}


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: ChatContext = ChatContext()


def _sse(data: dict) -> str:
    """SSE 이벤트 문자열 반환"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _generate(request: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in request.history]
    context = request.context.model_dump()

    try:
        async for chunk in stream_chat(request.message, history, context):
            yield _sse({"type": "delta", "content": chunk})
        yield _sse({"type": "done"})
    except ValueError as e:
        # API 키 미설정 등 설정 오류
        yield _sse({"type": "error", "message": str(e)})
    except Exception as e:
        yield _sse({"type": "error", "message": f"서버 오류가 발생했습니다: {type(e).__name__}"})


@router.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        _generate(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
