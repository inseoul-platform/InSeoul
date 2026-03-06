import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UserProfile — 사용자 입력 데이터 (만 원 단위)
 */
const defaultUserProfile = {
    cash: 0,           // 현재 보유 현금
    monthlySavings: 0, // 월 저축 가능액
    targetAmount: 0,   // 목표 자산 규모
    age: 30,           // 나이 (대출 적격 판단)
    income: 500,       // 월 소득 (만원, 대출 적격 판단)
};

/**
 * SimulationConfig — 시뮬레이션 설정
 */
const defaultSimConfig = {
    savingsIncreaseRate: 5,    // 연 저축액 증가율 (0~30%)
    investmentReturnRate: 8,   // 투자 수익률 (-10~30%)
    apartmentAnnualRise: 3,    // 아파트 연간 상승률 (%)
    ltvRatio: 0.5,             // LTV 비율 (50%)
    acquisitionTaxRate: 0.035, // 취득세율 (3.5%)
};

/**
 * AppState — UI 전역 상태
 */
const useAppStore = create(
    persist(
        (set, get) => ({
            // ── 사용자 프로필 ─────────────────────────
            userProfile: { ...defaultUserProfile },

            // ── 공공 API 데이터 ───────────────────────
            apiPrices: null,
            setApiPrices: (prices) => set({ apiPrices: prices }),

            setUserProfile: (partial) =>
                set((state) => ({
                    userProfile: { ...state.userProfile, ...partial },
                })),

            resetUserProfile: () =>
                set({ userProfile: { ...defaultUserProfile } }),

            // ── 시뮬레이션 설정 ───────────────────────
            simConfig: { ...defaultSimConfig },

            setSimConfig: (partial) =>
                set((state) => ({
                    simConfig: { ...state.simConfig, ...partial },
                })),

            resetSimConfig: () =>
                set({ simConfig: { ...defaultSimConfig } }),

            // ── 다크모드 ──────────────────────────────
            isDark: true,

            toggleDark: () => {
                const next = !get().isDark;
                set({ isDark: next });
                if (next) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            initDark: () => {
                const isDark = get().isDark;
                if (isDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            // ── 입력 완료 여부 ────────────────────────
            isProfileComplete: () => {
                const { cash, monthlySavings, targetAmount } = get().userProfile;
                return cash > 0 && monthlySavings > 0 && targetAmount > 0;
            },
        }),
        {
            name: 'inseoul-storage', // localStorage key
            partialize: (state) => ({
                userProfile: state.userProfile,
                simConfig: state.simConfig,
                isDark: state.isDark,
                apiPrices: state.apiPrices,
            }),
        }
    )
);

export default useAppStore;
