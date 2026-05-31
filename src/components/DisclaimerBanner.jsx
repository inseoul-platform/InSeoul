import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DisclaimerBanner() {
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem('disclaimer_dismissed') === 'true'
    );

    if (dismissed) return null;

    const handleDismiss = () => {
        sessionStorage.setItem('disclaimer_dismissed', 'true');
        setDismissed(true);
    };

    return (
        <aside
            role="note"
            aria-label="투자 면책 고지"
            className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5"
        >
            <div className="max-w-[1440px] mx-auto flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2 text-amber-800 dark:text-amber-300">
                    <span
                        className="material-symbols-outlined !text-base shrink-0 mt-0.5 sm:mt-0"
                        aria-hidden="true"
                    >
                        warning
                    </span>
                    <p className="text-xs leading-relaxed break-keep">
                        <strong>투자 자문 면책 고지:</strong> 본 서비스는 교육·참고 목적의 시뮬레이션 도구이며, 실제 투자 자문이 아닙니다.
                        제공되는 예측치는 참고용이며, 실제 부동산 시세·대출 조건 등과 다를 수 있습니다.
                        중요한 재무 결정은 반드시 전문가와 상담하시기 바랍니다.{' '}
                        <Link
                            to="/privacy"
                            className="underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                        >
                            개인정보 처리방침
                        </Link>
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                    aria-label="면책 고지 닫기"
                    data-no-touch-target
                >
                    <span className="material-symbols-outlined !text-lg" aria-hidden="true">close</span>
                </button>
            </div>
        </aside>
    );
}
