import { useState, useMemo, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts';
import useAppStore from '../store/useAppStore';

const DEFAULT_SIM = { savingsIncreaseRate: 5, investmentReturnRate: 8, apartmentAnnualRise: 3, ltvRatio: 0.5 };
import {
    calcGoldenCross, buildChartData, calcRequiredCapital,
    formatKRW, formatYearMonth,
} from '../utils/calculator';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-sm">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry) => (
                    <p key={entry.name} style={{ color: entry.color }} className="font-medium">
                        {entry.name}: {formatKRW(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function SliderControl({ id, label, min, max, step = 1, value, onChange, formatValue }) {
    const pct = Math.round(((value - min) / (max - min)) * 100);
    return (
        <div className="flex flex-col gap-2 group">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                    {label}
                </label>
                <span className="text-base font-bold text-primary tabular-nums">{formatValue(value)}</span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                aria-label={label}
                style={{
                    background: `linear-gradient(to right, #a2d2ff ${pct}%, #cbd5e1 ${pct}%)`,
                }}
            />
            <div className="flex justify-between text-xs text-slate-400">
                <span>{formatValue(min)}</span><span>{formatValue(max)}</span>
            </div>
        </div>
    );
}

export default function DashboardScreen() {
    const { userProfile, simConfig, setSimConfig, resetSimConfig } = useAppStore();
    const [savingsRate, setSavingsRate] = useState(simConfig.savingsIncreaseRate);
    const [returnRate, setReturnRate] = useState(simConfig.investmentReturnRate);
    const [aptRise, setAptRise] = useState(simConfig.apartmentAnnualRise);
    const [ltvPct, setLtvPct] = useState(Math.round(simConfig.ltvRatio * 100));

    const hasProfile = userProfile.cash > 0 && userProfile.monthlySavings > 0 && userProfile.targetAmount > 0;

    // 실질 프로필 (더 이상 대시보드에서 수동 계산하지 않고 시뮬레이터가 연 증가율을 직접 사용)
    const effectiveProfile = useMemo(() => {
        return userProfile;
    }, [userProfile]);

    const activeConfig = useMemo(() => ({
        ...simConfig,
        savingsIncreaseRate: savingsRate,
        investmentReturnRate: returnRate,
        apartmentAnnualRise: aptRise,
        ltvRatio: ltvPct / 100,
    }), [simConfig, savingsRate, returnRate, aptRise, ltvPct]);

    const goldenCross = useMemo(() => hasProfile ? calcGoldenCross(effectiveProfile, activeConfig) : null, [effectiveProfile, activeConfig, hasProfile]);

    const totalMonths = useMemo(() => {
        if (!hasProfile) return 120;
        if (!goldenCross) return 600;
        return Math.max(120, goldenCross.months + 24);
    }, [hasProfile, goldenCross]);

    const chartData = useMemo(() => {
        if (!hasProfile) return [];
        return buildChartData(effectiveProfile, activeConfig, totalMonths);
    }, [effectiveProfile, activeConfig, hasProfile, totalMonths]);

    const xAxisTicks = useMemo(() => {
        const step = totalMonths >= 360 ? 60 : 12;
        const ticks = [];
        for (let m = 0; m <= totalMonths; m += step) ticks.push(m);
        return ticks;
    }, [totalMonths]);
    const { requiredCapital, loanAmount, tax } = useMemo(() => {
        if (!hasProfile) return { requiredCapital: 0, loanAmount: 0, tax: 0 };
        return calcRequiredCapital(userProfile.targetAmount, ltvPct / 100, simConfig.acquisitionTaxRate);
    }, [userProfile, ltvPct, simConfig, hasProfile]);

    const handleSave = useCallback(() => {
        setSimConfig({ savingsIncreaseRate: savingsRate, investmentReturnRate: returnRate, apartmentAnnualRise: aptRise, ltvRatio: ltvPct / 100 });
    }, [savingsRate, returnRate, aptRise, ltvPct, setSimConfig]);

    const handleReset = useCallback(() => {
        resetSimConfig();
        setSavingsRate(DEFAULT_SIM.savingsIncreaseRate);
        setReturnRate(DEFAULT_SIM.investmentReturnRate);
        setAptRise(DEFAULT_SIM.apartmentAnnualRise);
        setLtvPct(Math.round(DEFAULT_SIM.ltvRatio * 100));
    }, [resetSimConfig]);

    const crossMonth = goldenCross?.months ?? null;

    return (
        <div className="flex flex-col overflow-x-hidden">
            <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 flex flex-col gap-6 sm:gap-8">
                <div className="flex flex-col gap-1 text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight break-keep">골든크로스 분석 대시보드</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base break-keep">자산 성장과 서울 아파트 가격 트렌드를 비교하여 내 집 마련의 꿈을 설계하세요.</p>
                </div>

                {!hasProfile && (
                    <div className="card p-8 text-center flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined !text-5xl text-primary">edit_note</span>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">데이터를 먼저 입력해주세요.</p>
                        <a href="/" className="interactive-element bg-primary text-slate-900 font-bold py-3 px-6 rounded-lg shadow-md">데이터 입력하기</a>
                    </div>
                )}

                {hasProfile && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                        {/* 차트 영역 */}
                        <div className="xl:col-span-2 flex flex-col gap-5 card p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-base sm:text-lg font-semibold text-left">자산 성장 vs 아파트 가격 예측</h2>
                                <div className="flex items-center gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary shadow-sm" /><span className="text-slate-600 dark:text-slate-400">내 자산</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" /><span className="text-slate-600 dark:text-slate-400">필요 자본금</span></div>
                                </div>
                            </div>

                            {goldenCross ? (
                                <div className="bg-secondary/20 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-secondary/40 hover:bg-secondary/30 transition-colors">
                                    <div className="bg-primary text-slate-900 p-2 rounded-full shadow-md animate-bounce shrink-0">
                                        <span className="material-symbols-outlined !text-base">star</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">예상 골든크로스</p>
                                        <p className="text-lg sm:text-2xl font-bold text-primary">
                                            {formatYearMonth(goldenCross.crossDate)}&nbsp;
                                            <span className="text-sm font-medium text-slate-500">({goldenCross.months}개월 후)</span>
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                        <p className="text-xs text-slate-500">현재 기준 월 저축액</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatKRW(effectiveProfile.monthlySavings)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 text-left">
                                    <p className="text-red-600 dark:text-red-400 font-medium text-sm">현재 설정으로는 50년 내 골든크로스 달성이 어렵습니다. 저축액이나 투자 수익률을 높여보세요.</p>
                                </div>
                            )}

                            <div className="w-full h-[260px] sm:h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                                        <XAxis
                                            dataKey="month"
                                            type="number"
                                            domain={[0, totalMonths]}
                                            ticks={xAxisTicks}
                                            tickFormatter={(m) => {
                                                const d = new Date();
                                                d.setMonth(d.getMonth() + m);
                                                return `${String(d.getFullYear()).slice(2)}년`;
                                            }}
                                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                                            tickLine={false}
                                        />
                                        <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={42} />
                                        <Tooltip content={<CustomTooltip />} />
                                        {crossMonth !== null && (
                                            <ReferenceLine x={crossMonth} stroke="#a2d2ff" strokeDasharray="4 4"
                                                label={{ value: '🏆 골든크로스', position: 'top', fontSize: 11, fill: '#a2d2ff' }} />
                                        )}
                                        <Line type="monotone" dataKey="asset" name="내 자산" stroke="#a2d2ff" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#a2d2ff' }} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="required" name="필요 자본금" stroke="#f87171" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4, fill: '#f87171' }} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 사이드패널 */}
                        <div className="flex flex-col gap-5">
                            <div className="card p-4 sm:p-6 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary !text-xl">tune</span>시뮬레이션 설정
                                    </h3>
                                    <button
                                        onClick={handleReset}
                                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 rounded-full font-medium flex items-center gap-1 transition-colors"
                                        aria-label="시뮬레이션 설정 초기화"
                                        title="기본값으로 초기화"
                                    >
                                        <span className="material-symbols-outlined !text-xs">refresh</span>초기화
                                    </button>
                                </div>
                                <div className="flex flex-col gap-5">
                                    <SliderControl id="slider-savings" label="연 저축액 증가율" min={0} max={30} value={savingsRate} onChange={setSavingsRate} formatValue={(v) => `${v}%`} />
                                    <SliderControl id="slider-return" label="연 투자 수익률" min={-10} max={30} value={returnRate} onChange={setReturnRate} formatValue={(v) => `${v}%`} />
                                    <SliderControl id="slider-apt-rise" label="아파트 연 상승률" min={0} max={15} value={aptRise} onChange={setAptRise} formatValue={(v) => `${v}%`} />
                                    <SliderControl id="slider-ltv" label="LTV 비율" min={30} max={70} value={ltvPct} onChange={setLtvPct} formatValue={(v) => `${v}%`} />
                                </div>
                                <button id="save-simulation" onClick={handleSave}
                                    className="interactive-element mt-2 w-full bg-primary hover:bg-primary/90 text-slate-900 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md">
                                    <span className="material-symbols-outlined !text-xl">save</span>설정 저장
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 text-left">
                                <div className="card p-4 sm:p-5 flex flex-col gap-2 hover:-translate-y-1 cursor-default">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined !text-base">account_balance</span>
                                        <h4 className="text-sm font-medium">LTV {ltvPct}% 대출 가능액</h4>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold tracking-tight hover:text-primary transition-colors">{formatKRW(loanAmount)}</p>
                                </div>
                                <div className="card p-4 sm:p-5 flex flex-col gap-2 hover:-translate-y-1 cursor-default">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined !text-base">payments</span>
                                        <h4 className="text-sm font-medium">필요 자본금 (취득세 포함)</h4>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-bold tracking-tight hover:text-primary transition-colors">{formatKRW(requiredCapital)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">* 예상 취득세: {formatKRW(tax)}</p>
                                </div>
                                {goldenCross && (
                                    <div className="card p-4 sm:p-5 flex flex-col gap-2 hover:-translate-y-1 cursor-default">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <span className="material-symbols-outlined !text-base text-primary">flag</span>
                                            <h4 className="text-sm font-medium">목표 아파트 예상 가격</h4>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-primary">{formatKRW(goldenCross.finalAptPrice)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">* 골든크로스 시점 기준</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                    * 본 분석은 참고용 정보이며 투자 자문이 아닙니다. 실제 부동산 투자 전 전문가와 상담하세요.
                </p>
            </main>
        </div>
    );
}
