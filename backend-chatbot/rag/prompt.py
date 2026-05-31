"""
prompt.py — RAG 기반 시스템 프롬프트 조합

구성:
1. 역할 정의: 한국어 서울 부동산 금융 어드바이저
2. 검색된 지식 문서 (RAG context)
3. 사용자 컨텍스트 (현재 페이지, userProfile, simConfig)
4. 응답 지침
"""

from typing import Any


SYSTEM_ROLE = """당신은 InSeoul 서울 아파트 구매 계획 서비스의 AI 어드바이저입니다.
사용자가 서울 아파트 구매를 위한 자금 계획, 대출 상품, 투자 전략에 대해 질문하면 정확하고 개인화된 답변을 제공합니다.

답변 지침:
- 한국어로 답변하세요.
- 금액은 만원 또는 억원 단위로 표현하세요.
- 사용자의 실제 수치(자산, 월 저축액, 목표 금액 등)가 있으면 구체적으로 언급하세요.
- 복잡한 개념은 예시와 수식으로 설명하세요.
- 답변은 간결하고 실용적으로 유지하세요 (200~400자 수준).
- 확실하지 않은 내용은 추측하지 말고 "정확한 조건은 해당 기관에 문의하세요"라고 안내하세요."""


def _format_rag_context(docs: list[dict]) -> str:
    if not docs:
        return ""

    lines = ["## 관련 지식 문서\n"]
    for i, doc in enumerate(docs, 1):
        source = doc.get("source", "")
        section = doc.get("section", "")
        content = doc.get("content", "")
        lines.append(f"[{i}] 출처: {source} / {section}")
        lines.append(content)
        lines.append("")

    return "\n".join(lines)


def _format_user_context(context: dict[str, Any]) -> str:
    if not context:
        return ""

    lines = ["## 사용자 현재 상황\n"]

    page = context.get("page", "")
    if page:
        page_names = {
            "/": "데이터 입력 화면",
            "/dashboard": "대시보드 (시뮬레이션 결과)",
            "/report": "분석 리포트",
            "/strategy": "전략 상세",
            "/map": "서울 지도",
        }
        page_label = page_names.get(page, page)
        lines.append(f"현재 페이지: {page_label}")

    user_profile = context.get("userProfile", {})
    if user_profile:
        lines.append("\n사용자 프로필:")
        field_labels = {
            "cash": "보유 현금",
            "monthlySavings": "월 저축액",
            "targetAmount": "목표 아파트 가격",
            "age": "나이",
            "income": "연 소득",
        }
        for key, label in field_labels.items():
            val = user_profile.get(key)
            if val is not None and val != "" and val != 0:
                if key in ("cash", "monthlySavings", "targetAmount", "income"):
                    lines.append(f"  - {label}: {int(val):,}만원")
                else:
                    lines.append(f"  - {label}: {val}")

    sim_config = context.get("simConfig", {})
    if sim_config:
        lines.append("\n시뮬레이션 설정:")
        config_labels = {
            "ltvRatio": ("LTV 비율", lambda v: f"{int(v * 100)}%"),
            "apartmentAnnualRise": ("아파트 연간 상승률", lambda v: f"{v}%"),
            "investmentReturnRate": ("투자 수익률", lambda v: f"{v}%"),
            "savingsIncreaseRate": ("저축 증가율", lambda v: f"{v}%"),
            "acquisitionTaxRate": ("취득세율", lambda v: f"{v * 100:.1f}%"),
        }
        for key, (label, fmt) in config_labels.items():
            val = sim_config.get(key)
            if val is not None:
                lines.append(f"  - {label}: {fmt(val)}")

    return "\n".join(lines)


def build_messages(
    user_message: str,
    history: list[dict],
    rag_docs: list[dict],
    context: dict[str, Any],
) -> list[dict]:
    """
    OpenAI chat.completions.create에 전달할 messages 배열을 구성한다.

    Args:
        user_message: 현재 사용자 메시지
        history: 이전 대화 [{role: "user"|"assistant", content: str}]
        rag_docs: retriever.retrieve() 결과
        context: {page, userProfile, simConfig}

    Returns:
        OpenAI messages 형식 리스트
    """
    rag_context = _format_rag_context(rag_docs)
    user_context = _format_user_context(context)

    system_parts = [SYSTEM_ROLE]
    if rag_context:
        system_parts.append(rag_context)
    if user_context:
        system_parts.append(user_context)

    system_content = "\n\n".join(system_parts)

    messages = [{"role": "system", "content": system_content}]

    # 대화 히스토리 추가 (최대 10턴)
    for turn in history[-10:]:
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    return messages
