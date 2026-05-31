import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { sendChatMessage } from '../services/chatbotService';

// 페이지별 힌트 칩
const PAGE_HINTS = {
    '/': ['자산이 얼마 있어야 하나요?', '월 저축액이 적당한가요?'],
    '/dashboard': ['골든크로스가 너무 멀어요', 'LTV를 올리면 어떻게 되나요?'],
    '/report': ['금리 상승이 왜 영향을 미치나요?', '어떤 전략이 맞나요?'],
    '/strategy': ['보금자리론 자격이 되나요?', '임장은 어떻게 하나요?'],
    '/map': ['진입 가능한 구는 어디인가요?', '색깔이 무슨 의미인가요?'],
};

// 점 3개 타이핑 인디케이터
function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined !text-[14px] text-primary">smart_toy</span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ msg, isStreaming = false }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex items-end gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* 아바타 */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-primary' : 'bg-primary/20'}`}>
                <span className={`material-symbols-outlined !text-[14px] ${isUser ? 'text-slate-900' : 'text-primary'}`}>
                    {isUser ? 'person' : 'smart_toy'}
                </span>
            </div>

            {/* 말풍선 */}
            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isUser
                    ? 'bg-primary text-slate-900 rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
            }`}>
                {msg.content.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
                {isStreaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 align-middle animate-pulse" />
                )}
            </div>
        </div>
    );
}

function SidebarContent({ onClose }) {
    const location = useLocation();
    const { chatMessages, addChatMessage, clearChatHistory, userProfile, simConfig } = useAppStore();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const hints = PAGE_HINTS[location.pathname] ?? [];
    const isBusy = isTyping || !!streamingContent;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isTyping, streamingContent]);

    const sendMessage = async (text) => {
        if (!text || isBusy) return;

        // 현재 스냅샷을 히스토리로 사용 (최근 10턴)
        const history = chatMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
        addChatMessage({ role: 'user', content: text, timestamp: Date.now() });
        setIsTyping(true);

        const context = {
            page: location.pathname,
            userProfile,
            simConfig,
        };

        try {
            let accumulated = '';
            let isFirst = true;
            for await (const chunk of sendChatMessage(text, history, context)) {
                if (isFirst) {
                    setIsTyping(false);
                    isFirst = false;
                }
                accumulated += chunk;
                setStreamingContent(accumulated);
            }
            if (accumulated) {
                addChatMessage({ role: 'assistant', content: accumulated, timestamp: Date.now() });
            }
        } catch (err) {
            const isFetchError =
                err.message?.includes('Failed to fetch') ||
                err.message?.includes('fetch') ||
                err.message?.includes('ERR_CONNECTION');
            const errorMsg = isFetchError
                ? '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
                : '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            addChatMessage({ role: 'assistant', content: errorMsg, timestamp: Date.now() });
        } finally {
            setIsTyping(false);
            setStreamingContent('');
        }
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput('');
        sendMessage(text);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = chatMessages.length === 0 && !isBusy;

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[20px] text-primary">smart_toy</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">인서울 AI 어드바이저</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearChatHistory}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="대화 초기화"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            restart_alt
                        </span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="닫기"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            chevron_right
                        </span>
                    </button>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary !text-[24px]">smart_toy</span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">인서울 AI 어드바이저</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            LTV, 골든크로스, 대출 상품 등 궁금한 점을 물어보세요.
                        </p>
                        {hints.length > 0 && (
                            <div className="flex flex-col gap-2 w-full mt-1">
                                {hints.map((hint) => (
                                    <button
                                        key={hint}
                                        onClick={() => sendMessage(hint)}
                                        className="text-xs text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {chatMessages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        {isTyping && <TypingIndicator />}
                        {streamingContent && (
                            <MessageBubble
                                msg={{ role: 'assistant', content: streamingContent }}
                                isStreaming
                            />
                        )}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* 입력창 */}
            <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="질문을 입력하세요..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none outline-none leading-5 max-h-24 overflow-y-auto"
                        style={{ fieldSizing: 'content' }}
                        disabled={isBusy}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isBusy}
                        className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
                    >
                        <span className="material-symbols-outlined !text-[18px] text-slate-900">send</span>
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter로 전송 · Shift+Enter 줄바꿈</p>
            </div>
        </div>
    );
}

export default function ChatbotSidebar() {
    const { chatOpen, toggleChat } = useAppStore();

    return (
        <>
            {/* ── PC 사이드바 (md 이상) ── */}
            <div
                className={`hidden md:flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden ${
                    chatOpen ? 'w-80' : 'w-10'
                }`}
            >
                {chatOpen ? (
                    <SidebarContent onClose={toggleChat} />
                ) : (
                    /* 닫힌 상태: 세로 토글 스트립 */
                    <button
                        onClick={toggleChat}
                        className="flex-1 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="챗봇 열기"
                    >
                        <span className="material-symbols-outlined !text-[20px] text-primary">smart_toy</span>
                        <span
                            className="text-[10px] font-bold text-slate-400 tracking-wider"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                        >
                            AI 어드바이저
                        </span>
                    </button>
                )}
            </div>

            {/* ── 모바일 오버레이 (md 미만) ── */}
            {chatOpen && (
                <>
                    {/* 배경 딤 */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/40 z-40"
                        onClick={toggleChat}
                    />
                    {/* 슬라이드인 패널 */}
                    <div className="md:hidden fixed inset-y-0 right-0 w-80 z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
                        <SidebarContent onClose={toggleChat} />
                    </div>
                </>
            )}

            {/* ── 모바일 FAB (닫힌 상태) ── */}
            {!chatOpen && (
                <button
                    onClick={toggleChat}
                    className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:bg-primary/80 transition-colors"
                    title="챗봇 열기"
                >
                    <span className="material-symbols-outlined !text-[24px] text-slate-900">smart_toy</span>
                </button>
            )}
        </>
    );
}
