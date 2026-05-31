"""
chain.py — RAG 체인: retrieve → prompt → OpenAI 스트리밍

흐름:
  1. retriever.retrieve(query) → 관련 청크 top-4
  2. prompt.build_messages(message, history, docs, context) → messages
  3. openai.chat.completions.create(stream=True) → yield text chunks
"""

import os
from typing import AsyncGenerator, Any

from openai import AsyncOpenAI

from rag.retriever import retrieve
from rag.prompt import build_messages

MODEL = "gpt-5-nano"


def _get_openai_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
    return AsyncOpenAI(api_key=api_key)


async def stream_chat(
    message: str,
    history: list[dict],
    context: dict[str, Any],
) -> AsyncGenerator[str, None]:
    """
    RAG 체인을 실행하고 텍스트 청크를 비동기적으로 yield한다.

    Yields:
        str: LLM이 생성한 텍스트 청크
    """
    # 1. 검색
    rag_docs = retrieve(message)

    # 2. 프롬프트 조합
    messages = build_messages(message, history, rag_docs, context)

    # 3. OpenAI 스트리밍 호출
    client = _get_openai_client()
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if delta and delta.content:
            yield delta.content
