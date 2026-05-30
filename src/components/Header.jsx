import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';


const NAV_ITEMS = [
    { to: '/', label: '데이터 입력', tab: 'input' },
    { to: '/dashboard', label: '대시보드', tab: 'dashboard' },
    { to: '/report', label: '리포트', tab: 'report' },
    { to: '/map', label: '타겟팅 맵', tab: 'map' },
];

/**
 * Header — 공통 네비게이션
 * @param {boolean} showSearch  지도 페이지에서만 true
 * @param {function} onSearch   검색 이벤트 핸들러
 */
export default function Header({ showSearch = false, onSearch }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark, toggleDark, toggleChat, isLoggedIn, clearAuth, authUser } = useAppStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleUserClick = () => {
        if (isLoggedIn()) {
            setDropdownOpen((prev) => !prev);
        } else {
            navigate('/login');
        }
    };

    const handleLogout = () => {
        clearAuth();
        setDropdownOpen(false);
        navigate('/login');
    };

    const isActive = (tab) => {
        if (tab === 'input') return location.pathname === '/';
        if (tab === 'dashboard') return location.pathname === '/dashboard';
        if (tab === 'report')
            return (
                location.pathname === '/report' || location.pathname === '/strategy'
            );
        if (tab === 'map') return location.pathname === '/map';
        return false;
    };

    return (
        <header className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm w-full transition-colors duration-300">
            <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 w-full max-w-[1440px] mx-auto">
                {/* 로고 */}
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 sm:gap-3 text-primary interactive-element hover:opacity-80 shrink-0"
                    >
                        <span className="material-symbols-outlined text-2xl sm:text-3xl !text-primary">
                            apartment
                        </span>
                        <span className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                            인서울
                        </span>
                    </Link>

                    {/* 검색창 (지도 페이지 전용) */}
                    {showSearch && (
                        <div className="relative w-full max-w-xs hidden lg:block group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">
                                search
                            </span>
                            <input
                                id="map-search"
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all duration-300"
                                placeholder="지역 검색 (예: 마포구)"
                                type="text"
                                aria-label="지역 검색"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (onSearch) onSearch(e.target.value);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* 우측 영역 */}
                <div className="flex items-center gap-3 sm:gap-6">
                    {/* PC 네비게이션 */}
                    <nav
                        className="hidden md:flex items-center gap-5 sm:gap-8 text-sm sm:text-base font-medium"
                        aria-label="주요 네비게이션"
                    >
                        {NAV_ITEMS.map(({ to, label, tab }) => (
                            <Link
                                key={tab}
                                to={to}
                                className={`relative transition-all duration-300 hover:-translate-y-0.5 pb-0.5 ${isActive(tab)
                                    ? 'text-primary font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-primary'
                                    }`}
                                aria-current={isActive(tab) ? 'page' : undefined}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* 챗봇 토글 */}
                    <button
                        onClick={toggleChat}
                        className="bg-primary/10 dark:bg-primary/20 rounded-full size-9 sm:size-11 flex items-center justify-center cursor-pointer interactive-element hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors duration-300 shrink-0"
                        aria-label="AI 어드바이저 열기/닫기"
                    >
                        <span className="material-symbols-outlined text-primary transition-colors !text-[20px]">
                            smart_toy
                        </span>
                    </button>

                    {/* 다크모드 토글 */}
                    <button
                        id="dark-mode-toggle"
                        onClick={toggleDark}
                        className="bg-secondary/30 dark:bg-slate-800 rounded-full size-9 sm:size-11 flex items-center justify-center cursor-pointer interactive-element hover:bg-secondary/50 dark:hover:bg-slate-700 transition-colors duration-300 shrink-0"
                        aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 transition-colors !text-[20px]">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* 사용자 아이콘 + 드롭다운 */}
                    <div className="relative hidden sm:block" ref={dropdownRef}>
                        <button
                            onClick={handleUserClick}
                            className="flex bg-secondary/30 dark:bg-slate-800 rounded-full size-11 items-center justify-center cursor-pointer interactive-element hover:bg-secondary/50 dark:hover:bg-slate-700 transition-colors duration-300 shrink-0"
                            aria-label={isLoggedIn() ? '계정 메뉴' : '로그인'}
                        >
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 transition-colors !text-[20px]">
                                person
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {authUser?.nickname ?? authUser?.email ?? ''}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {authUser?.email ?? ''}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    로그아웃
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 햄버거 메뉴 (모바일) */}
                    <button
                        id="mobile-menu-toggle"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="md:hidden bg-secondary/30 dark:bg-slate-800 rounded-full size-9 flex items-center justify-center cursor-pointer interactive-element hover:bg-secondary/50 dark:hover:bg-slate-700 transition-colors duration-300 shrink-0"
                        aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                        aria-expanded={isMenuOpen}
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 !text-[20px]">
                            {isMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* 모바일 드롭다운 내비게이션 */}
            <div
                className={`${isMenuOpen ? 'flex' : 'hidden'
                    } md:hidden flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 gap-1 shadow-inner`}
            >
                {NAV_ITEMS.map(({ to, label, tab }) => (
                    <Link
                        key={tab}
                        to={to}
                        onClick={() => setIsMenuOpen(false)}
                        className={`py-2.5 px-4 rounded-lg text-left font-medium transition-colors text-sm ${isActive(tab)
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        aria-current={isActive(tab) ? 'page' : undefined}
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </header>
    );
}
