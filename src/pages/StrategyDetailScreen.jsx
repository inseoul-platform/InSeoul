import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import useAppStore from '../store/useAppStore';
import { calcGoldenCross, calcRequiredCapital, formatKRW, formatYearMonth } from '../utils/calculator';

// ── 전략 타입별 데이터 ──────────────────────────────────────────
const STRATEGY_DATA = {
    relay: {
        badge: '추천 대안 1 — 경유 전략',
        tabLabel: '경유 전략',
        title: '광명시 철산동 아파트 경유 전략',
        subtitle: '현재 모인 자금과 월 저축액으로 2년 내에 진입 가능한 현실적인 대안 지역입니다. 이곳에서 실거주하며 자산을 안정적으로 증식한 후 인서울을 노려보는 것을 권장합니다.',
        targetPrice: 35000, // 만원
        accentGradient: 'from-sky-400 to-blue-500',
        riskLevel: '낮음',
        riskBadge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        steps: [
            { step: 1, title: '자금 확보 및 계획 수립', desc: '현재 거주지 전세금 회수 일정 확인 및 부족분 대출 계획 수립. 광명시 철산동 기준 약 3.5억 예산 확인.', icon: 'account_balance', phasePct: 0 },
            { step: 2, title: '지역 임장 및 매물 탐색', desc: '철산동 주요 단지 (철산주공 등 20평대) 주말 임장 진행. 역세권 단지 우선 탐색.', icon: 'map', phasePct: 25 },
            { step: 3, title: '금융 상품 매칭', desc: '보금자리론, 디딤돌 대출 등 정책 대출 상품 한도 및 금리 조건 확인. 최저 금리 상품 우선 검토.', icon: 'credit_card', phasePct: 60 },
            { step: 4, title: '계약 및 전입신고', desc: '매매계약 체결 후 30일 이내 전입신고 완료. 취득세 신고·납부 진행.', icon: 'fact_check', phasePct: 90 },
        ],
    },
    downsize: {
        badge: '추천 대안 2 — 평수 하향',
        tabLabel: '평수 하향',
        title: '목표 지역 내 평수 하향 조정 전략',
        subtitle: '원하는 목표 지역(예: 마포구)을 유지하되, 평수를 20평대로 줄여 초기 진입 장벽을 낮추는 전략입니다. 목표 지역 상승세를 그대로 누리면서 자본금을 줄일 수 있는 방법입니다.',
        targetPrice: 55000, // 만원
        accentGradient: 'from-violet-400 to-purple-500',
        riskLevel: '중간',
        riskBadge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        steps: [
            { step: 1, title: '축소 평형 목표 설정', desc: '20~24평 기준으로 목표 지역 내 매물 가격 재조사. 마포구 20평대 기준 약 5.5억 내외 확인.', icon: 'straighten', phasePct: 0 },
            { step: 2, title: '추가 자금 마련 계획 수립', desc: '부족한 자본금 충당을 위한 재형저축, ETF 적립식 투자 병행 계획 수립.', icon: 'savings', phasePct: 25 },
            { step: 3, title: '금융 상품 매칭', desc: '보금자리론 (공시가 9억 이하 조건 확인), 디딤돌 대출 (미혼·신혼부부 조건 확인) 검토.', icon: 'credit_card', phasePct: 60 },
            { step: 4, title: '목표 지역 임장 및 계약', desc: '역세권·학군 우선 매물 탐색. 계약 전 등기부등본, 건축물대장 필수 확인.', icon: 'fact_check', phasePct: 90 },
        ],
    },
};

// ── 정책 대출 상품 데이터 ─────────────────────────────────────
const LOAN_PRODUCTS = [
    {
        key: 'bogeumjari',
        name: '보금자리론',
        type: '고정금리 장기 주택담보대출',
        rate: '연 3.65~4.00%',
        limit: '최대 3.6억 원',
        condition: '주택가격 9억 원 이하 / 부부합산 소득 7천만 원 이하',
        colorClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        badgeClass: 'bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300',
        icon: 'home',
        // 적격 판단: targetPrice <= 90000(9억) & 연소득(income*12) <= 7000
        checkEligibility: (profile, targetPrice) => {
            const annualIncome = (profile.income || 0) * 12;
            return targetPrice <= 90000 && annualIncome <= 7000;
        },
    },
    {
        key: 'didimdul',
        name: '디딤돌 대출',
        type: '저금리 주택구입자금 대출',
        rate: '연 2.45~3.55%',
        limit: '최대 2.5억 원',
        condition: '주택가격 5억 원 이하 / 부부합산 소득 6천만 원 이하 (신혼 7천만)',
        colorClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        badgeClass: 'bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-300',
        icon: 'volunteer_activism',
        checkEligibility: (profile, targetPrice) => {
            const annualIncome = (profile.income || 0) * 12;
            return targetPrice <= 50000 && annualIncome <= 7000;
        },
    },
    {
        key: 'butimok',
        name: '청년전용 버팀목 전세자금',
        type: '청년 전세보증금 대출',
        rate: '연 1.5~2.1%',
        limit: '최대 7천만 원',
        condition: '만 19~34세 / 단독세대주 / 순자산 8,600만 원 이하',
        colorClass: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        badgeClass: 'bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-300',
        icon: 'person',
        checkEligibility: (profile) => {
            return (profile.age || 99) <= 34;
        },
    },
];

function formatMonths(m) {
    if (m == null) return '계산 불가';
    const y = Math.floor(m / 12);
    const mo = m % 12;
    return y > 0 ? (mo > 0 ? `${y}년 ${mo}개월` : `${y}년`) : `${mo}개월`;
}

// 타임라인 단계별 예상 날짜 계산
function calcStepDates(baseDate, totalMonths) {
    if (!baseDate || totalMonths == null) return null;
    const phases = [0, 0.25, 0.6, 0.9];
    return phases.map((pct) => {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() - totalMonths + Math.round(totalMonths * pct));
        return d;
    });
}

export default function StrategyDetailScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { userProfile, simConfig } = useAppStore();

    const type = searchParams.get('type') === 'downsize' ? 'downsize' : 'relay';
    const strategy = STRATEGY_DATA[type];

    const hasProfile = userProfile.cash > 0 && userProfile.monthlySavings > 0 && userProfile.targetAmount > 0;

    // ── 이 전략의 KPI 계산 ─────────────────────────────────────
    const kpiData = useMemo(() => {
        const strategyProfile = { ...userProfile, targetAmount: strategy.targetPrice };
        const cross = calcGoldenCross(strategyProfile, simConfig);
        const { requiredCapital, loanAmount, tax } = calcRequiredCapital(
            strategy.targetPrice,
            simConfig.ltvRatio,
            simConfig.acquisitionTaxRate
        );
        const progressPct = hasProfile
            ? Math.min(100, Math.round((userProfile.cash / requiredCapital) * 100))
            : 0;
        const shortage = Math.max(0, requiredCapital - (userProfile.cash || 0));
        return {
            months: cross?.months ?? null,
            crossDate: cross?.crossDate ?? null,
            requiredCapital,
            loanAmount,
            tax,
            progressPct,
            shortage,
        };
    }, [userProfile, simConfig, hasProfile, strategy.targetPrice]);

    // ── 직접 인서울 KPI (비교용) ──────────────────────────────
    const directKpi = useMemo(() => {
        if (!hasProfile) return null;
        const cross = calcGoldenCross(userProfile, simConfig);
        const { requiredCapital } = calcRequiredCapital(
            userProfile.targetAmount,
            simConfig.ltvRatio,
            simConfig.acquisitionTaxRate
        );
        return { months: cross?.months ?? null, crossDate: cross?.crossDate ?? null, requiredCapital };
    }, [userProfile, simConfig, hasProfile]);

    // ── 타임라인 날짜 ────────────────────────────────────────
    const stepDates = useMemo(
        () => calcStepDates(kpiData.crossDate, kpiData.months),
        [kpiData.crossDate, kpiData.months]
    );

    const TYPES = ['relay', 'downsize'];

    const KPI = [
        {
            icon: 'schedule',
            label: '예상 소요 기간',
            value: kpiData.months != null ? formatMonths(kpiData.months) : '약 2년',
            subtext: kpiData.crossDate ? `${formatYearMonth(kpiData.crossDate)} 달성 예상` : '데이터를 입력하면 계산됩니다',
        },
        {
            icon: 'payments',
            label: '필요 자본금',
            value: formatKRW(kpiData.requiredCapital),
            subtext: `목표가: ${formatKRW(strategy.targetPrice)} · 대출: ${formatKRW(kpiData.loanAmount)}`,
        },
        {
            icon: 'trending_up',
            label: '기대 연 수익률',
            value: `연 ${simConfig.apartmentAnnualRise ?? 3}%`,
            subtext: '아파트 연간 상승률 기준',
            accent: true,
        },
        {
            icon: 'account_balance_wallet',
            label: '현재 보유 자산',
            value: hasProfile ? formatKRW(userProfile.cash) : '-',
            subtext: hasProfile ? `목표 달성률 ${kpiData.progressPct}%` : '데이터를 입력하면 표시됩니다',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen text-left">
            <Header />

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-10 flex flex-col gap-6 pb-16">
                {/* 뒤로가기 */}
                <button
                    onClick={() => navigate('/report')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors self-start text-sm sm:text-base"
                    aria-label="리포트로 돌아가기"
                >
                    <span className="material-symbols-outlined !text-base">arrow_back</span>
                    <span className="font-medium">리포트로 돌아가기</span>
                </button>

                {/* 전략 타입 탭 */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                    {TYPES.map((t) => (
                        <button
                            key={t}
                            onClick={() => navigate(`/strategy?type=${t}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${type === t
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {STRATEGY_DATA[t].tabLabel}
                        </button>
                    ))}
                </div>

                <div className="card p-6 sm:p-8 md:p-10 flex flex-col gap-8">
                    {/* ── 전략 타이틀 ─────────────────────────── */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-4 py-1.5 bg-secondary/30 text-primary w-fit text-sm font-bold rounded-full">
                                {strategy.badge}
                            </span>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${strategy.riskBadge}`}>
                                리스크: {strategy.riskLevel}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight break-keep">
                            {strategy.title}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl break-keep">
                            {strategy.subtitle}
                        </p>
                    </div>

                    {/* ── KPI 카드 4종 ─────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {KPI.map(({ icon, label, value, subtext, accent }) => (
                            <div
                                key={label}
                                className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2 hover:-translate-y-1 transition-transform cursor-default"
                            >
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <span className="material-symbols-outlined !text-base">{icon}</span>
                                    <h3 className="text-xs font-medium">{label}</h3>
                                </div>
                                <p className={`text-xl sm:text-2xl font-bold leading-tight ${accent ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                                    {value}
                                </p>
                                {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{subtext}</p>}
                            </div>
                        ))}
                    </div>

                    {/* ── 자본금 달성률 진행바 ───────────────────── */}
                    {hasProfile && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-base">stacked_bar_chart</span>
                                    자본금 달성 현황
                                </h3>
                                <span className="text-sm font-black text-primary">{kpiData.progressPct}%</span>
                            </div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full bg-gradient-to-r ${strategy.accentGradient} rounded-full transition-all duration-1000`}
                                    style={{ width: `${kpiData.progressPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">현재 자산</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">{formatKRW(userProfile.cash)}</p>
                                </div>
                                <div className="text-center">
                                    {kpiData.shortage > 0 && (
                                        <>
                                            <p className="text-xs text-slate-400 mb-0.5">부족 금액</p>
                                            <p className="font-bold text-red-500">{formatKRW(kpiData.shortage)}</p>
                                        </>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-0.5">필요 자본금</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">{formatKRW(kpiData.requiredCapital)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 단계별 실행 가이드 타임라인 ─────────────── */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary !text-2xl">check_circle</span>
                            실행 단계 가이드
                        </h2>
                        <div className="flex flex-col gap-6 relative before:absolute before:left-5 before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                            {strategy.steps.map(({ step, title, desc, icon }, idx) => (
                                <div key={step} className="relative flex items-start gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-4 border-primary z-10 shadow shrink-0">
                                        <span className="text-primary font-bold text-sm">{step}</span>
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-transform">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary !text-base">{icon}</span>
                                                <h3 className="text-base font-bold break-keep text-slate-900 dark:text-white">{title}</h3>
                                            </div>
                                            {stepDates && stepDates[idx] && (
                                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full shrink-0">
                                                    {formatYearMonth(stepDates[idx])} 예상
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 break-keep leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── 정책 대출 상품 (적격 여부 포함) ─────────── */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary !text-2xl">account_balance</span>
                            활용 가능한 정책 대출 상품
                        </h2>
                        <div className="flex flex-col gap-4">
                            {LOAN_PRODUCTS.map((loan) => {
                                const eligible = loan.checkEligibility(userProfile, strategy.targetPrice);
                                return (
                                    <div
                                        key={loan.key}
                                        className={`rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4 hover:-translate-y-1 transition-transform ${loan.colorClass}`}
                                    >
                                        <div className="shrink-0">
                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${loan.badgeClass}`}>
                                                <span className="material-symbols-outlined !text-xl">{loan.icon}</span>
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base">{loan.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loan.badgeClass}`}>{loan.type}</span>
                                                {/* 적격 여부 배지 */}
                                                {hasProfile ? (
                                                    eligible ? (
                                                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                                                            ✅ 가능할 수 있음
                                                        </span>
                                                    ) : (
                                                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
                                                            ⚠️ 조건 확인 필요
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium">
                                                        데이터 입력 후 확인
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400 block text-xs">금리</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{loan.rate}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 dark:text-slate-400 block text-xs">한도</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-100">{loan.limit}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                조건: {loan.condition}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            * 대출 금리 및 한도는 변동될 수 있습니다. 최신 정보는 HF 한국주택금융공사 또는 각 은행에서 확인하세요.
                        </p>
                    </div>

                    {/* ── 이 전략 vs 직접 인서울 비교 ─────────────── */}
                    {directKpi && (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary !text-2xl">compare_arrows</span>
                                이 전략 vs 직접 인서울 비교
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 이 전략 */}
                                <div className={`rounded-xl p-5 sm:p-6 bg-gradient-to-br ${strategy.accentGradient} text-white`}>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-3 text-white/80">
                                        {strategy.tabLabel} 전략
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <p className="text-xs text-white/70">목표 금액</p>
                                            <p className="text-xl font-black">{formatKRW(strategy.targetPrice)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70">예상 소요 기간</p>
                                            <p className="text-xl font-black">{kpiData.months != null ? formatMonths(kpiData.months) : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70">필요 자본금</p>
                                            <p className="text-xl font-black">{formatKRW(kpiData.requiredCapital)}</p>
                                        </div>
                                        <div className={`inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${strategy.riskBadge} bg-white/20 text-white`}>
                                            리스크 {strategy.riskLevel}
                                        </div>
                                    </div>
                                </div>

                                {/* 직접 인서울 */}
                                <div className="rounded-xl p-5 sm:p-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400">
                                        직접 인서울
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <p className="text-xs text-slate-400">목표 금액</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white">{formatKRW(userProfile.targetAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">예상 소요 기간</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white">{directKpi.months != null ? formatMonths(directKpi.months) : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">필요 자본금</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white">{formatKRW(directKpi.requiredCapital)}</p>
                                        </div>
                                        <div className="inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                            리스크 높음
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 면책 고지 */}
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        * 본 전략은 참고용 정보이며 투자 자문이 아닙니다. 실제 부동산 투자 전 전문가와 상담하세요.
                    </p>
                </div>
            </main>
        </div>
    );
}
