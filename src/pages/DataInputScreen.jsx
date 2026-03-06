import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '../components/Header';
import useAppStore from '../store/useAppStore';
import { formatKRW } from '../utils/calculator';

const STEPS = [
    {
        id: 1,
        label: '자산',
        question: '현재 사용 가능한 현금은 얼마인가요?',
        desc: '비상금을 포함한 여유 자금을 입력해주세요. (단위: 만 원)',
        field: 'cash',
        tip: { label: '30대 직장인 평균 비상금', value: '2,500만 원' },
        tipNote: '여유 자금을 정확히 파악하는 것이 성공적인 내 집 마련의 첫 걸음입니다.',
        min: 100,
        max: 100000,
        placeholder: '예: 3,000',
        unit: '만 원',
        multiplier: 1,
        buttons: [
            { label: '+ 1천만', add: 1000 },
            { label: '+ 5천만', add: 5000 },
            { label: '+ 1억', add: 10000 },
        ]
    },
    {
        id: 2,
        label: '현금 흐름',
        question: '매월 저축 가능한 금액은 얼마인가요?',
        desc: '월 수입에서 지출을 제외한 저축 가능액을 입력해주세요. (단위: 만 원)',
        field: 'monthlySavings',
        tip: { label: '30대 직장인 평균 월 저축액', value: '85만 원' },
        tipNote: '꾸준한 저축이 골든크로스를 앞당기는 가장 확실한 방법입니다.',
        min: 10,
        max: 5000,
        placeholder: '예: 150',
        unit: '만 원',
        multiplier: 1,
        buttons: [
            { label: '+ 10만', add: 10 },
            { label: '+ 50만', add: 50 },
            { label: '+ 100만', add: 100 },
        ]
    },
    {
        id: 3,
        label: '목표',
        question: '목표로 하는 아파트 가격은 얼마인가요?',
        desc: '내 집 마련을 위해 목표로 하는 아파트 시세를 입력해주세요. (단위: 만 원)',
        field: 'targetAmount',
        tip: { label: '서울 아파트 평균 시세', value: '약 8억 원' },
        tipNote: '서울 내 진입을 원하는 지역과 평형을 고려하여 목표액을 설정하세요.',
        min: 10000,
        max: 500000,
        placeholder: '예: 80,000',
        unit: '만 원',
        multiplier: 1,
        buttons: [
            { label: '+ 1천만', add: 1000 },
            { label: '+ 5천만', add: 5000 },
            { label: '+ 1억', add: 10000 },
        ]
    },
];

const makeSchema = (step) => {
    const s = STEPS[step - 1];
    return z.object({
        amount: z
            .string()
            .min(1, '금액을 입력해주세요.')
            .refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: '0보다 큰 숫자를 입력해주세요.' })
            .refine((v) => Number(v) >= s.min, { message: `최소 ${s.min.toLocaleString()}${s.unit} 이상 입력해주세요.` })
            .refine((v) => Number(v) <= s.max, { message: `최대 ${s.max.toLocaleString()}${s.unit} 이하로 입력해주세요.` }),
    });
};

export default function DataInputScreen() {
    const navigate = useNavigate();
    const { userProfile, setUserProfile } = useAppStore();
    const [step, setStep] = useState(1);
    const [, setDirection] = useState('forward'); // 'forward' | 'backward'

    const current = STEPS[step - 1];
    const progress = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(makeSchema(step)),
        mode: 'onChange',
        defaultValues: { amount: '' },
    });

    const amountValue = watch('amount');

    // 단계 전환 시 기존 값 불러오기
    useEffect(() => {
        const existing = userProfile[current.field];
        const displayValue = existing > 0 ? existing / current.multiplier : '';
        reset({ amount: displayValue !== '' ? String(displayValue) : '' });
    }, [step, current.field, current.multiplier, reset, userProfile]);

    const addAmount = (add) => {
        const currentVal = Number(amountValue || 0);
        setValue('amount', String(currentVal + add), { shouldValidate: true });
    };

    const handleNext = (data) => {
        const value = Number(data.amount) * current.multiplier;
        setUserProfile({ [current.field]: value });

        if (step < 3) {
            setDirection('forward');
            setStep((prev) => prev + 1);
        } else {
            navigate('/dashboard');
        }
    };

    const handleBack = () => {
        setDirection('backward');
        setStep((prev) => prev - 1);
    };

    const inputBorderClass = errors.amount
        ? 'border-red-400 focus:ring-red-400/30'
        : amountValue && !errors.amount
            ? 'border-green-400 focus:ring-green-400/30'
            : 'border-slate-200 dark:border-slate-700 focus:ring-primary/50';

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 flex justify-center px-4 sm:px-10 py-6 sm:py-10">
                <div className="flex flex-col max-w-[960px] w-full gap-6 sm:gap-8">

                    {/* Step Indicator */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 sm:gap-6 justify-between items-center text-xs sm:text-base whitespace-nowrap overflow-x-auto pb-2 scrollbar-hide">
                            {STEPS.map((s, i) => (
                                <div key={s.id} className="flex items-center gap-1 flex-1 justify-center">
                                    {i > 0 && (
                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 shrink-0 !text-base mx-1">
                                            chevron_right
                                        </span>
                                    )}
                                    <div
                                        className={`flex flex-1 justify-center items-center gap-1 sm:gap-2 font-medium transition-all duration-300 cursor-default ${step >= s.id ? 'text-primary' : 'text-slate-400'
                                            }`}
                                    >
                                        <span
                                            className={`${step > s.id
                                                ? 'bg-green-400 text-white shadow-md'
                                                : step === s.id
                                                    ? 'bg-primary text-slate-900 shadow-md ring-4 ring-primary/20'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                } rounded-full size-6 flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300`}
                                        >
                                            {step > s.id ? (
                                                <span className="material-symbols-outlined !text-xs">check</span>
                                            ) : (
                                                s.id
                                            )}
                                        </span>
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                                style={{ width: progress }}
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <form onSubmit={handleSubmit(handleNext)}>
                        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                            {/* Input Card */}
                            <div className="flex-1 card p-6 sm:p-8 flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <h1 className="text-slate-900 dark:text-white tracking-tight text-xl sm:text-2xl md:text-3xl font-bold leading-tight break-keep text-left">
                                        {current.question}
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed break-keep text-left">
                                        {current.desc}
                                    </p>
                                </div>

                                {/* Amount Input */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="flex flex-col w-full relative group">
                                            <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 !text-xl ${errors.amount ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`}>
                                                payments
                                            </span>
                                            <input
                                                id={`input-step-${step}`}
                                                {...register('amount')}
                                                className={`w-full pl-12 pr-16 h-14 sm:h-16 text-lg sm:text-xl font-medium rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 shadow-inner transition-all duration-300 ${inputBorderClass}`}
                                                placeholder={current.placeholder}
                                                type="number"
                                                min="0"
                                                aria-label={current.question}
                                                aria-invalid={!!errors.amount}
                                            />
                                            <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-medium text-sm sm:text-base transition-colors ${errors.amount ? 'text-red-400' : 'text-slate-500 dark:text-slate-400 group-focus-within:text-primary'}`}>
                                                {current.unit}
                                            </span>
                                        </label>

                                        {/* Inline Error Message */}
                                        <div className={`overflow-hidden transition-all duration-300 ${errors.amount ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p
                                                role="alert"
                                                className="flex items-center gap-1.5 text-red-500 text-sm font-medium"
                                            >
                                                <span className="material-symbols-outlined !text-sm">error</span>
                                                {errors.amount?.message}
                                            </p>
                                        </div>

                                        {/* Converted Value Hint */}
                                        {amountValue && !isNaN(Number(amountValue)) && Number(amountValue) > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 mt-2 bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-slate-600 dark:text-slate-400 font-bold text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm">환산액</span>
                                                    <p className="text-slate-900 dark:text-white font-extrabold text-2xl sm:text-3xl tracking-tight">
                                                        {formatKRW(Number(amountValue) * current.multiplier)}
                                                    </p>
                                                </div>
                                                {!errors.amount && (
                                                    <p className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-bold">
                                                        <span className="material-symbols-outlined !text-base">check_circle</span>
                                                        입력 올바름
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        {current.buttons.map(({ label, add }) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => addAmount(add)}
                                                className="interactive-element flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-secondary/20 hover:bg-secondary/40 text-primary dark:text-secondary rounded-lg text-sm font-medium border border-secondary/30 whitespace-nowrap"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => reset({ amount: '' })}
                                            className="w-full sm:w-auto px-4 py-2 whitespace-nowrap text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium underline transition-colors sm:ml-auto"
                                        >
                                            초기화
                                        </button>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="mt-4 sm:mt-auto pt-4 flex justify-between items-center gap-3">
                                    {/* Back Button */}
                                    <div>
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="interactive-element flex items-center gap-2 text-slate-500 hover:text-primary transition-colors px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary text-sm font-medium"
                                                aria-label="이전 단계로 돌아가기"
                                            >
                                                <span className="material-symbols-outlined !text-base">arrow_back</span>
                                                이전 단계
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        id={`next-step-${step}`}
                                        type="submit"
                                        className="interactive-element bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 px-6 sm:px-8 rounded-lg shadow-md flex items-center justify-center gap-2 text-base sm:text-lg transition-all duration-300"
                                    >
                                        {step === 3 ? '결과 확인' : '다음 단계'}
                                        <span className="material-symbols-outlined !text-xl">
                                            {step === 3 ? 'bar_chart' : 'arrow_forward'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Smart Tip Panel */}
                            <div className="w-full lg:w-[300px] flex flex-col gap-4">
                                <div className="flex flex-col gap-4 rounded-lg bg-secondary/10 dark:bg-secondary/5 border border-secondary/30 p-5 sm:p-6 shadow-sm interactive-element">
                                    <div className="flex items-center gap-2 text-primary border-b border-secondary/20 pb-3">
                                        <span className="material-symbols-outlined animate-pulse !text-xl">lightbulb</span>
                                        <p className="text-primary text-base font-bold">스마트 팁</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-secondary/20 shadow-sm">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                                {current.tip.label}
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-primary">
                                                {current.tip.value}
                                            </p>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed text-left">
                                            {current.tipNote}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Tips */}
                                <div className="card p-4 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        입력 도움말
                                    </p>
                                    <ul className="flex flex-col gap-2">
                                        <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined !text-sm text-primary mt-0.5 shrink-0">info</span>
                                            <span>단위는 <strong>만 원</strong>입니다. 1억 = 10,000 만 원</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined !text-sm text-primary mt-0.5 shrink-0">add_circle</span>
                                            <span>빠른 입력 버튼으로 금액을 빠르게 더할 수 있어요</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Privacy Notice */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 py-4 px-4 sm:px-6 rounded-2xl sm:rounded-full mx-auto border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 cursor-default text-center w-full max-w-xl">
                        <span className="material-symbols-outlined !text-base">lock</span>
                        <p className="text-xs sm:text-sm font-medium break-keep">
                            사용자의 데이터는 서버에 저장되지 않으며, 브라우저에만 안전하게 보관됩니다.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
