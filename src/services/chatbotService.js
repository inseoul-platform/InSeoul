/**
 * chatbotService.js — SSE 스트리밍 클라이언트
 * 백엔드 POST /chat 호출 후 async generator로 텍스트 청크를 yield한다.
 */

/**
 * @param {string} message
 * @param {{ role: string, content: string }[]} history
 * @param {{ page: string, userProfile: object, simConfig: object }} context
 * @yields {string} 텍스트 청크
 */
export async function* sendChatMessage(message, history, context) {
    const apiUrl = import.meta.env.VITE_CHATBOT_API_URL ?? 'http://127.0.0.1:8000';

    let res;
    try {
        res = await fetch(`${apiUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, context }),
        });
    } catch (err) {
        throw new Error(`Failed to fetch: ${err.message}`);
    }

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? ''; // 마지막 불완전 라인은 버퍼에 보관

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                let event;
                try {
                    event = JSON.parse(jsonStr);
                } catch {
                    continue; // 잘못된 JSON 건너뜀
                }

                if (event.type === 'delta' && event.content) {
                    yield event.content;
                } else if (event.type === 'done') {
                    return;
                } else if (event.type === 'error') {
                    throw new Error(event.message ?? '알 수 없는 오류');
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}
