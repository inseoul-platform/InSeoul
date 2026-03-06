import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useAppStore from '../store/useAppStore';
import {
    calcGoldenCross,
    calcInterestRateStress,
    calcPriceRiseStress,
    calcRequiredCapital,
    formatKRW,
    formatYearMonth,
} from '../utils/calculator';

// ── 데모 데이터 (userProfile 없을 때 예시) ───────────────────────
const DEMO_PROFILE = {
    cash: 8000,
    monthlySavings: 250,
    targetAmount: 90000,
    age: 32,
    income: 450,
};
const DEMO_CONFIG = {
    investmentReturnRate: 8,
    apartmentAnnualRise: 3,
    ltvRatio: 0.5,
    acquisitionTaxRate: 0.035,
    savingsIncreaseRate: 5,
};

// ── 대안 전략 정적 데이터 ─────────────────────────────────────────
const STRATEGIES = [
    {
        type: 'relay',
        badge: '추천 대안 1',
        title: '광명시 철산동 아파트 경유',
        desc: '현재 자금과 저축액으로 진입 가능한 현실적 대안 지역에서 자산을 키운 후 인서울을 노립니다.',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
        targetPrice: 35000,
        accentColor: 'from-sky-400 to-blue-500',
        badgeColor: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    },
    {
        type: 'downsize',
        badge: '추천 대안 2',
        title: '목표 지역 평수 하향 조정',
        desc: '원하는 목표 지역(예: 마포구)을 유지하되 평수를 20평대로 줄여 초기 진입 장벽을 낮춥니다.',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
        targetPrice: 55000,
        accentColor: 'from-violet-400 to-purple-500',
        badgeColor: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    },
];

// ── 위험도 레벨 헬퍼 ─────────────────────────────────────────────
function getRiskLevel(delayMonths) {
    if (!delayMonths || delayMonths === 0) return { label: 'LOW', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-400', pct: 20 };
    if (delayMonths >= 999) return { label: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500', pct: 100 };
    if (delayMonths <= 6) return { label: 'LOW', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-400', pct: 25 };
    if (delayMonths <= 18) return { label: 'MEDIUM', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-400', pct: 55 };
    return { label: 'HIGH', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-400', pct: 85 };
}

function formatDelay(months) {
    if (!months || months === 0) return '영향 없음';
    if (months >= 999) return '목표 달성 불가';
    const y = Math.floor(months / 12);
    const m = months % 12;
    return y > 0 ? (m > 0 ? `+${y}년 ${m}개월` : `+${y}년`) : `+${m}개월`;
}

function formatMonths(m) {
    if (m == null) return '-';
    const y = Math.floor(m / 12);
    const mo = m % 12;
    return y > 0 ? (mo > 0 ? `${y}년 ${mo}개월` : `${y}년`) : `${mo}개월`;
}

export default function ReportScreen() {
    const navigate = useNavigate();
    const { userProfile, simConfig } = useAppStore();
    const [actionDelta, setActionDelta] = useState(50); // 추가 월 저축액 (만원)

    const hasProfile = userProfile.cash > 0 && userProfile.monthlySavings > 0 && userProfile.targetAmount > 0;

    // 실제 또는 데모 데이터
    const profile = hasProfile ? userProfile : DEMO_PROFILE;
    const config = hasProfile ? simConfig : DEMO_CONFIG;

    // ── 메인 골든크로스 계산 ──────────────────────────────────────
    const goldenCross = useMemo(() => calcGoldenCross(profile, config), [profile, config]);

    // ── 스트레스 테스트 계산 ──────────────────────────────────────
    const interestStress = useMemo(() => {
        if (!goldenCross) return null;
        return calcInterestRateStress(profile, config, 1, goldenCross.loanAmount);
    }, [profile, config, goldenCross]);

    const priceStress = useMemo(() => {
        return calcPriceRiseStress(profile, config, 10);
    }, [profile, config]);

    // ── 스트레스 시나리오 날짜 계산 ──────────────────────────────
    const stressedInterestDate = useMemo(() => {
        if (!goldenCross || !interestStress || interestStress.delayMonths >= 999) return null;
        const d = new Date(goldenCross.crossDate);
        d.setMonth(d.getMonth() + interestStress.delayMonths);
        return d;
    }, [goldenCross, interestStress]);

    const stressedPriceDate = useMemo(() => {
        if (!goldenCross || !priceStress || priceStress.delayMonths >= 999) return null;
        const d = new Date(goldenCross.crossDate);
        d.setMonth(d.getMonth() + priceStress.delayMonths);
        return d;
    }, [goldenCross, priceStress]);

    // ── 징검다리 전략별 계산 ──────────────────────────────────────
    const strategyCalcs = useMemo(() => {
        return STRATEGIES.map((s) => {
            const strategyProfile = { ...profile, targetAmount: s.targetPrice };
            const cross = calcGoldenCross(strategyProfile, config);
            const { requiredCapital } = calcRequiredCapital(s.targetPrice, config.ltvRatio, config.acquisitionTaxRate);
            const progressPct = Math.min(100, Math.round((profile.cash / requiredCapital) * 100));
            return {
                ...s,
                cross,
                requiredCapital,
                progressPct,
                shortage: Math.max(0, requiredCapital - profile.cash),
            };
        });
    }, [profile, config]);

    // ── 액션 가이드 계산 ──────────────────────────────────────────
    const actionResult = useMemo(() => {
        if (!goldenCross) return null;
        const boosted = { ...profile, monthlySavings: profile.monthlySavings + actionDelta };
        const res = calcGoldenCross(boosted, config);
        if (!res) return null;
        const saved = goldenCross.months - res.months;
        return { saved, newMonths: res.months, newDate: res.crossDate };
    }, [profile, config, goldenCross, actionDelta]);

    const interestRisk = getRiskLevel(interestStress?.delayMonths);
    const priceRisk = getRiskLevel(priceStress?.delayMonths);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <div className="max-w-5xl mx-auto w-full flex flex-col flex-grow text-left pb-16">

                {/* ── 데모 안내 배너 ─────────────────────────────── */}
                {!hasProfile && (
                    <div className="mx-4 sm:mx-8 mt-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500 !text-xl shrink-0">info</span>
                        <p className="text-sm text-amber-700 dark:text-amber-300 break-keep">
                            <strong>데이터 미입력 상태</strong>입니다. 아래는 예시 데이터를 기반으로 한 리포트입니다.{' '}
                            <button onClick={() => navigate('/')} className="underline font-bold hover:text-amber-900 dark:hover:text-amber-100 transition-colors">
                                데이터를 입력하러 가기 →
                            </button>
                        </p>
                    </div>
                )}

                {/* ── 페이지 헤더 ────────────────────────────────── */}
                <header className="px-4 sm:px-8 py-8 sm:py-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-red-500/5 to-orange-500/5 dark:from-red-900/10 dark:to-orange-900/10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500 shadow-sm shrink-0">
                            <span className="material-symbols-outlined !text-3xl">shield</span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight break-keep">
                                리스크 컨트롤 타워 & 징검다리 리포트
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base sm:text-lg break-keep">
                                목표{' '}
                                <strong className="text-slate-700 dark:text-slate-200">{formatKRW(profile.targetAmount)}</strong>{' '}
                                기준 · 예상 달성{' '}
                                <strong className="text-primary">{goldenCross ? formatYearMonth(goldenCross.crossDate) : '-'}</strong>
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── 리스크 스트레스 테스트 ─────────────────────── */}
                <section className="px-4 sm:px-8 py-8 sm:py-10">
                    <div className="flex items-center gap-3 mb-6 hover:translate-x-1 transition-transform cursor-default">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 shadow-sm shrink-0">
                            <span className="material-symbols-outlined animate-pulse !text-xl sm:!text-2xl">warning</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight break-keep">
                            리스크 컨트롤 타워 — 스트레스 테스트
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                        {/* 금리 1% 상승 카드 */}
                        <div className="card p-5 sm:p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-default">
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white break-keep">금리가 1% 상승한다면?</h3>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm break-keep">
                                        대출 이자 부담 ↑ → 실질 저축액 감소 시뮬레이션
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${interestRisk.bg} ${interestRisk.color}`}>
                                    {interestRisk.label}
                                </div>
                            </div>

                            {/* 위험도 게이지 */}
                            <div className="mb-5">
                                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                    <span>위험도</span>
                                    <span className={`font-bold ${interestRisk.color}`}>{interestRisk.pct}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${interestRisk.bar} rounded-full transition-all duration-700`}
                                        style={{ width: `${interestRisk.pct}%` }}
                                    />
                                </div>
                            </div>

                            {/* 날짜 비교 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">현재 목표일</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        {goldenCross ? formatYearMonth(goldenCross.crossDate) : '-'}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">금리 상승 시</p>
                                    <p className="text-sm font-bold text-red-500">
                                        {stressedInterestDate ? formatYearMonth(stressedInterestDate) : '달성 어려움'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">목표일 지연</span>
                                <span className={`text-xl font-black ${interestStress?.delayMonths ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {formatDelay(interestStress?.delayMonths)}
                                </span>
                            </div>
                        </div>

                        {/* 주택 가격 10% 상승 카드 */}
                        <div className="card p-5 sm:p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-default">
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white break-keep">주택 가격이 10% 오른다면?</h3>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm break-keep">
                                        목표 가격 상승 → 필요 자본금 증가 시뮬레이션
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${priceRisk.bg} ${priceRisk.color}`}>
                                    {priceRisk.label}
                                </div>
                            </div>

                            {/* 위험도 게이지 */}
                            <div className="mb-5">
                                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                    <span>위험도</span>
                                    <span className={`font-bold ${priceRisk.color}`}>{priceRisk.pct}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${priceRisk.bar} rounded-full transition-all duration-700`}
                                        style={{ width: `${priceRisk.pct}%` }}
                                    />
                                </div>
                            </div>

                            {/* 날짜 비교 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">현재 목표일</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        {goldenCross ? formatYearMonth(goldenCross.crossDate) : '-'}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">가격 상승 시</p>
                                    <p className="text-sm font-bold text-red-500">
                                        {stressedPriceDate ? formatYearMonth(stressedPriceDate) : '달성 어려움'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">목표일 지연</span>
                                <span className={`text-xl font-black ${priceStress?.delayMonths ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {formatDelay(priceStress?.delayMonths)}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 징검다리 리포트 ────────────────────────────── */}
                <section className="px-4 sm:px-8 py-8 sm:py-10 bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3 mb-3 hover:translate-x-1 transition-transform cursor-default">
                        <div className="p-2 bg-secondary/30 rounded-lg text-primary shadow-sm shrink-0">
                            <span className="material-symbols-outlined !text-xl sm:!text-2xl">route</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">징검다리 리포트</h2>
                    </div>
                    <p className="text-base text-slate-600 dark:text-slate-400 mb-8 break-keep">
                        최종 목표 달성이 멀게 느껴진다면, 현실적인 중간 목표를 설정해보세요.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {strategyCalcs.map((s) => (
                            <div
                                key={s.type}
                                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col"
                                onClick={() => navigate(`/strategy?type=${s.type}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/strategy?type=${s.type}`)}
                                aria-label={`${s.title} 상세 전략 보기`}
                            >
                                {/* 이미지 + 그라디언트 오버레이 */}
                                <div className="relative h-44 overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url('${s.image}')` }}
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${s.accentColor} opacity-40 group-hover:opacity-50 transition-opacity`} />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${s.badgeColor}`}>{s.badge}</span>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 flex-grow flex flex-col gap-4">
                                    {/* 제목 + 도달 가능 기간 */}
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors break-keep text-slate-900 dark:text-white">
                                                {s.title}
                                            </h3>
                                            <span className="text-slate-500 text-xs font-medium shrink-0 flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-xs">schedule</span>
                                                {s.cross ? `약 ${formatMonths(s.cross.months)}` : '계산 중'}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed break-keep">{s.desc}</p>
                                    </div>

                                    {/* 목표 금액 & 자산 현황 */}
                                    <div className="flex justify-between text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">목표 필요 자본금</p>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{formatKRW(s.requiredCapital)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-0.5">현재 보유 자산</p>
                                            <p className="font-bold text-primary">{formatKRW(profile.cash)}</p>
                                        </div>
                                    </div>

                                    {/* 진행률 바 */}
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                            <span>자본금 달성률</span>
                                            <span className="font-bold text-slate-600 dark:text-slate-300">{s.progressPct}%</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${s.accentColor} rounded-full transition-all duration-1000`}
                                                style={{ width: `${s.progressPct}%` }}
                                            />
                                        </div>
                                        {s.shortage > 0 && (
                                            <p className="text-xs text-slate-400 mt-1.5 text-right">
                                                부족 금액: <strong className="text-slate-600 dark:text-slate-300">{formatKRW(s.shortage)}</strong>
                                            </p>
                                        )}
                                    </div>

                                    <button className="w-full mt-auto py-3 bg-primary/10 hover:bg-primary text-primary hover:text-slate-900 rounded-xl font-semibold text-sm transition-all duration-300 border border-primary/30 group-hover:border-primary">
                                        상세 전략 보기 →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 액션 가이드 ────────────────────────────────── */}
                <section className="px-4 sm:px-8 py-8 sm:py-10">
                    <div className="flex items-center gap-3 mb-6 hover:translate-x-1 transition-transform cursor-default">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-sm shrink-0">
                            <span className="material-symbols-outlined !text-xl sm:!text-2xl">lightbulb</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">액션 가이드</h2>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {/* 슬라이더 컨트롤 */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 break-keep">
                                월 저축액을 <strong className="text-primary text-base">{formatKRW(actionDelta)}</strong> 더 늘린다면?
                            </p>
                            <input
                                type="range"
                                min={10}
                                max={300}
                                step={10}
                                value={actionDelta}
                                onChange={(e) => setActionDelta(Number(e.target.value))}
                                className="w-full h-2 appearance-none rounded-full cursor-pointer accent-primary"
                                aria-label="추가 월 저축액 조절"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                                <span>+10만원</span>
                                <span>+300만원</span>
                            </div>
                        </div>

                        {/* 비교 결과 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-700">
                            <div className="p-6 sm:p-8 flex flex-col gap-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">현재 계획</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                    {goldenCross ? formatMonths(goldenCross.months) : '-'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {goldenCross ? formatYearMonth(goldenCross.crossDate) + ' 달성 예상' : '데이터를 입력하세요'}
                                </p>
                            </div>
                            <div className="p-6 sm:p-8 flex flex-col gap-2 bg-primary/5 dark:bg-primary/10">
                                <p className="text-xs font-bold uppercase tracking-wider text-primary">저축 증가 시</p>
                                <p className="text-2xl sm:text-3xl font-black text-primary">
                                    {actionResult ? formatMonths(actionResult.newMonths) : '-'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {actionResult
                                        ? `${formatYearMonth(actionResult.newDate)} 달성 예상`
                                        : '-'}
                                </p>
                                {actionResult && actionResult.saved > 0 && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                                        <span className="material-symbols-outlined text-emerald-500 !text-sm">trending_down</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatMonths(actionResult.saved)} 단축!
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 면책 고지 ──────────────────────────────────── */}
                <div className="px-4 sm:px-8 pb-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                        * 본 리포트는 참고용 정보이며 투자 자문이 아닙니다. 실제 부동산 투자 전 전문가와 상담하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
