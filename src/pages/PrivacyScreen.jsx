import { Link } from 'react-router-dom';

const SECTIONS = [
    {
        title: '1. 수집하는 개인정보 항목',
        content: `본 서비스(인서울)는 회원가입 및 서비스 이용 시 다음과 같은 개인정보를 수집합니다.
• 필수 항목: 이메일 주소, 닉네임, 비밀번호(암호화 저장)
• 자동 수집 항목: 서비스 이용 기록, 접속 로그(IP 주소 등)
• 시뮬레이션 데이터: 사용자가 입력한 자산 정보(현금, 월 저축액, 목표 금액)는 서버에 저장되지 않으며 브라우저 세션에만 보관됩니다.`,
    },
    {
        title: '2. 개인정보의 수집 및 이용 목적',
        content: `수집한 개인정보는 다음 목적에 한하여 사용됩니다.
• 회원제 서비스 제공 및 본인 확인
• 시뮬레이션 설정 저장 및 복원 (로그인 사용자 한정)
• 서비스 개선을 위한 통계 분석 (비식별화 처리)
• 법령 상 의무 이행`,
    },
    {
        title: '3. 개인정보의 보유 및 이용 기간',
        content: `개인정보는 수집·이용 목적이 달성되면 지체 없이 파기합니다.
• 회원 정보: 회원 탈퇴 시 즉시 삭제
• 관계 법령에 따라 보존이 필요한 경우 해당 기간 보관 (전자상거래법 등)`,
    },
    {
        title: '4. 개인정보의 제3자 제공',
        content: `본 서비스는 법령에 의한 경우 또는 이용자의 명시적 동의가 있는 경우를 제외하고, 수집한 개인정보를 제3자에게 제공하지 않습니다.`,
    },
    {
        title: '5. 개인정보 처리의 위탁',
        content: `현재 개인정보 처리 업무를 외부에 위탁하고 있지 않습니다. 위탁이 필요한 경우 사전에 본 방침을 통해 공지합니다.`,
    },
    {
        title: '6. 이용자의 권리',
        content: `이용자는 언제든지 다음 권리를 행사할 수 있습니다.
• 개인정보 열람 요청
• 오류가 있는 정보의 정정 요청
• 개인정보 삭제(탈퇴) 요청
• 처리 정지 요청
요청은 서비스 내 계정 설정 또는 이메일(dh4m28@gmail.com)을 통해 가능합니다.`,
    },
    {
        title: '7. 쿠키 및 유사 기술',
        content: `본 서비스는 로그인 상태 유지를 위해 브라우저 로컬스토리지를 사용합니다. 이용자는 브라우저 설정을 통해 저장소 데이터를 삭제할 수 있으나, 일부 기능이 제한될 수 있습니다.`,
    },
    {
        title: '8. 개인정보 보호책임자',
        content: `개인정보 처리에 관한 문의, 불만, 피해구제 신청은 아래로 연락하시기 바랍니다.
• 성명: 인서울 운영팀
• 이메일: dh4m28@gmail.com`,
    },
    {
        title: '9. 개인정보 처리방침의 변경',
        content: `본 방침은 2026년 3월 1일부터 시행합니다. 내용이 변경되는 경우 변경 사항을 서비스 내 공지사항을 통해 7일 전 사전 고지합니다.`,
    },
];

export default function PrivacyScreen() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
            <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
                aria-label="홈으로 돌아가기"
            >
                <span className="material-symbols-outlined !text-base" aria-hidden="true">arrow_back</span>
                돌아가기
            </Link>

            <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    개인정보 처리방침
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    최종 수정일: 2026년 3월 1일 · 시행일: 2026년 3월 1일
                </p>
            </header>

            <div
                role="note"
                className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8 text-sm text-amber-800 dark:text-amber-300"
            >
                <strong>투자 자문 면책 고지:</strong> 인서울은 교육·참고 목적의 부동산 시뮬레이션 서비스이며,
                실제 투자 자문, 금융 상품 판매, 중개 행위를 하지 않습니다.
                제공되는 모든 수치와 예측은 참고용이며 실제 결과와 다를 수 있습니다.
                중요한 재무 결정은 반드시 전문가와 상담하시기 바랍니다.
            </div>

            <article className="flex flex-col gap-8">
                {SECTIONS.map(({ title, content }) => (
                    <section key={title} aria-labelledby={`section-${title}`}>
                        <h2
                            id={`section-${title}`}
                            className="text-base font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700"
                        >
                            {title}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {content}
                        </p>
                    </section>
                ))}
            </article>
        </div>
    );
}
