/**
 * apiClient.js — Spring Boot 백엔드 Axios 클라이언트
 * - JWT Bearer 토큰 자동 첨부
 * - 401 수신 시 refreshToken으로 재발급 후 원래 요청 재시도
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

const AUTH_KEY = 'inseoul-auth';

export function getTokens() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null');
    } catch {
        return null;
    }
}

export function setTokens(accessToken, refreshToken) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ accessToken, refreshToken }));
}

export function clearTokens() {
    localStorage.removeItem(AUTH_KEY);
}

const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 15_000,
});

// ── 요청 인터셉터: 토큰 첨부 ──────────────────────────────────
apiClient.interceptors.request.use((config) => {
    const tokens = getTokens();
    if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
});

// ── 응답 인터셉터: 401 시 토큰 갱신 + 재시도 ─────────────────
let refreshing = false;
let waiters = [];

apiClient.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status !== 401 || original._retry) {
            return Promise.reject(err);
        }

        const tokens = getTokens();
        if (!tokens?.refreshToken) {
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(err);
        }

        if (refreshing) {
            return new Promise((resolve, reject) => {
                waiters.push({ resolve, reject, config: original });
            });
        }

        refreshing = true;
        original._retry = true;

        try {
            const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
                refreshToken: tokens.refreshToken,
            });
            const { accessToken, refreshToken } = data.data;
            setTokens(accessToken, refreshToken);

            waiters.forEach(({ resolve, config }) => {
                config.headers.Authorization = `Bearer ${accessToken}`;
                resolve(apiClient(config));
            });
            waiters = [];

            original.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(original);
        } catch (refreshErr) {
            waiters.forEach(({ reject }) => reject(refreshErr));
            waiters = [];
            clearTokens();
            window.dispatchEvent(new Event('auth:logout'));
            return Promise.reject(refreshErr);
        } finally {
            refreshing = false;
        }
    }
);

export default apiClient;
