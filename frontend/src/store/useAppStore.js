import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient, { setTokens, clearTokens, getTokens } from '../services/apiClient';

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
            // ── 인증 ──────────────────────────────────
            authUser: null, // { id, email, nickname, provider }

            setAuth: (user, accessToken, refreshToken) => {
                setTokens(accessToken, refreshToken);
                set({ authUser: user });
            },

            clearAuth: () => {
                clearTokens();
                set({ authUser: null });
            },

            isLoggedIn: () => {
                const tokens = getTokens();
                return !!tokens?.accessToken && !!get().authUser;
            },

            /** 서버에서 최신 프로필/simConfig 가져와 store에 반영 */
            hydrateFromServer: async () => {
                try {
                    const { data: res } = await apiClient.get('/api/users/me');
                    const { user, profile, simConfig } = res.data;
                    if (user) set({ authUser: user });
                    if (profile) {
                        set({ userProfile: {
                            cash: profile.cash,
                            monthlySavings: profile.monthlySavings,
                            targetAmount: profile.targetAmount,
                            age: profile.age,
                            income: profile.income,
                        }});
                    }
                    if (simConfig) {
                        set({ simConfig: {
                            savingsIncreaseRate: Number(simConfig.savingsIncreaseRate),
                            investmentReturnRate: Number(simConfig.investmentReturnRate),
                            apartmentAnnualRise: Number(simConfig.apartmentAnnualRise),
                            ltvRatio: Number(simConfig.ltvRatio),
                            acquisitionTaxRate: Number(simConfig.acquisitionTaxRate),
                        }});
                    }
                } catch (e) {
                    console.error('hydrateFromServer failed:', e);
                }
            },

            /** 로컬 userProfile 변경을 서버에 푸시 */
            pushProfile: async () => {
                const { userProfile } = get();
                try {
                    await apiClient.put('/api/users/me/profile', userProfile);
                } catch (e) {
                    console.error('pushProfile failed:', e);
                }
            },

            /** 로컬 simConfig 변경을 서버에 푸시 */
            pushSimConfig: async () => {
                const { simConfig } = get();
                try {
                    await apiClient.put('/api/users/me/sim-config', simConfig);
                } catch (e) {
                    console.error('pushSimConfig failed:', e);
                }
            },

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

            // ── 챗봇 ──────────────────────────────────
            chatOpen: true,
            chatMessages: [], // { role: 'user'|'assistant', content: string, timestamp: number }

            toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

            addChatMessage: (msg) =>
                set((s) => ({
                    chatMessages: [...s.chatMessages.slice(-49), msg],
                })),

            clearChatHistory: () => set({ chatMessages: [] }),
        }),
        {
            name: 'inseoul-storage', // localStorage key
            partialize: (state) => ({
                authUser: state.authUser,
                userProfile: state.userProfile,
                simConfig: state.simConfig,
                isDark: state.isDark,
                apiPrices: state.apiPrices,
                chatOpen: state.chatOpen,
                chatMessages: state.chatMessages,
            }),
        }
    )
);

export default useAppStore;
