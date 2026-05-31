/**
 * chatbotService.js — SSE 스트리밍 클라이언트
 * W7: FastAPI 직접 호출 → Spring 백엔드(/api/chat)로 전환
 */
import { getTokens } from './apiClient';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

/**
 * @param {string} message
 * @param {{ role: string, content: string }[]} history
 * @param {{ page: string, userProfile: object, simConfig: object }} context
 * @yields {string} 텍스트 청크
 */
export async function* sendChatMessage(message, history, context) {
    const tokens = getTokens();
    const headers = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) {
        headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    let res;
    try {
        res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers,
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
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                let event;
                try {
                    event = JSON.parse(jsonStr);
                } catch {
                    continue;
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
