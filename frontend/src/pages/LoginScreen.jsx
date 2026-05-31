import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAppStore from '../store/useAppStore';
import { setTokens } from '../services/apiClient';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

export default function LoginScreen() {
    const navigate = useNavigate();
    const { setAuth, isLoggedIn, clearAuth } = useAppStore();

    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [form, setForm] = useState({ email: '', password: '', nickname: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // OAuth2 callback 처리: URL fragment에 #accessToken=...&refreshToken=...
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;

        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
            setTokens(accessToken, refreshToken);
            window.history.replaceState(null, '', window.location.pathname);
            // 서버에서 사용자 정보 로드
            axios.get(`${API_BASE}/api/users/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }).then(({ data: res }) => {
                setAuth(res.data.user, accessToken, refreshToken);
                navigate('/', { replace: true });
            }).catch(() => {
                setError('로그인 처리 중 오류가 발생했습니다.');
            });
        }
    }, []);

    // 이미 로그인된 경우 홈으로 이동
    useEffect(() => {
        if (isLoggedIn()) navigate('/', { replace: true });
    }, []);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
            const body = mode === 'login'
                ? { email: form.email, password: form.password }
                : { email: form.email, password: form.password, nickname: form.nickname };

            const { data: res } = await axios.post(`${API_BASE}${endpoint}`, body);
            const { accessToken, refreshToken, user } = res.data;
            setAuth(user, accessToken, refreshToken);
            navigate('/', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.error?.message ?? '오류가 발생했습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth2 = (provider) => {
        clearAuth();
        window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 mb-2 hover:opacity-80 transition-opacity"
                        aria-label="인서울 홈으로 이동"
                    >
                        <span className="material-symbols-outlined !text-4xl !text-[#a2d2ff]">apartment</span>
                        <span className="text-3xl font-bold text-white">인서울</span>
                    </Link>
                    <p className="text-gray-400 mt-2 text-sm">서울 아파트 구매 시뮬레이터</p>
                </div>

                {/* 탭 */}
                <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
                    {['login', 'signup'].map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(''); }}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                                mode === m
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {m === 'login' ? '로그인' : '회원가입'}
                        </button>
                    ))}
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">닉네임</label>
                            <input
                                name="nickname"
                                value={form.nickname}
                                onChange={handleChange}
                                placeholder="닉네임"
                                required
                                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">이메일</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="이메일 주소"
                            required
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="비밀번호"
                            required
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                        {loading ? '처리 중...' : (mode === 'login' ? '로그인' : '회원가입')}
                    </button>
                </form>

                {/* 구분선 */}
                <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-700" />
                    <span className="px-4 text-gray-500 text-sm">또는</span>
                    <div className="flex-1 border-t border-gray-700" />
                </div>

                {/* OAuth2 버튼 */}
                <div className="space-y-3">
                    <button
                        onClick={() => handleOAuth2('kakao')}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">💬</span> 카카오로 계속하기
                    </button>
                    <button
                        onClick={() => handleOAuth2('google')}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">G</span> Google로 계속하기
                    </button>
                </div>

                {/* 비로그인 사용 안내 */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    로그인 없이도{' '}
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-400 hover:underline"
                    >
                        시뮬레이터 사용
                    </button>
                    이 가능합니다.
                </p>
            </div>
        </div>
    );
}
