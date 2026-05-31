// import { useState, useMemo, useEffect, useRef } from 'react';
// import Header from '../components/Header';
// import useAppStore from '../store/useAppStore';
// import { formatKRW, calcGoldenCross } from '../utils/calculator';
// import { loadSeoulAptPrices } from '../services/api';
// import { Map, CustomOverlayMap, ZoomControl, Polyline } from 'react-kakao-maps-sdk';

// // ── 서울 25개 구 전체 데이터 ────────────────────────────────────────
// // price: 만원 단위 대표 시세 (2024년 기준 모의 데이터)
// const ALL_REGIONS = [
//     // 서북권
//     { region: '은평구', lat: 37.6027, lng: 126.9291, price: 61000, tier: 1 },
//     { region: '서대문구', lat: 37.5791, lng: 126.9368, price: 68000, tier: 1 },
//     { region: '마포구', lat: 37.5662, lng: 126.9016, price: 79000, tier: 2 },
//     // 도심권
//     { region: '종로구', lat: 37.5730, lng: 126.9794, price: 84000, tier: 2 },
//     { region: '중구', lat: 37.5637, lng: 126.9976, price: 81000, tier: 2 },
//     { region: '용산구', lat: 37.5325, lng: 126.9900, price: 130000, tier: 3 },
//     // 동북권
//     { region: '노원구', lat: 37.6542, lng: 127.0568, price: 57000, tier: 1 },
//     { region: '도봉구', lat: 37.6688, lng: 127.0471, price: 54000, tier: 1 },
//     { region: '강북구', lat: 37.6396, lng: 127.0257, price: 53000, tier: 1 },
//     { region: '성북구', lat: 37.5894, lng: 127.0167, price: 67000, tier: 1 },
//     { region: '동대문구', lat: 37.5744, lng: 127.0400, price: 69000, tier: 2 },
//     { region: '중랑구', lat: 37.6063, lng: 127.0926, price: 61000, tier: 1 },
//     { region: '광진구', lat: 37.5385, lng: 127.0824, price: 82000, tier: 2 },
//     // 서남권
//     { region: '강서구', lat: 37.5509, lng: 126.8495, price: 66000, tier: 1 },
//     { region: '양천구', lat: 37.5169, lng: 126.8660, price: 74000, tier: 2 },
//     { region: '구로구', lat: 37.4954, lng: 126.8874, price: 62000, tier: 1 },
//     { region: '금천구', lat: 37.4568, lng: 126.8954, price: 58000, tier: 1 },
//     { region: '영등포구', lat: 37.5259, lng: 126.8966, price: 86000, tier: 2 },
//     { region: '동작구', lat: 37.5124, lng: 126.9393, price: 88000, tier: 2 },
//     // 동남권
//     { region: '관악구', lat: 37.4782, lng: 126.9515, price: 72000, tier: 1 },
//     { region: '서초구', lat: 37.4837, lng: 127.0324, price: 158000, tier: 3 },
//     { region: '강남구', lat: 37.5172, lng: 127.0473, price: 192000, tier: 3 },
//     { region: '송파구', lat: 37.5145, lng: 127.1066, price: 132000, tier: 3 },
//     { region: '강동구', lat: 37.5301, lng: 127.1238, price: 94000, tier: 2 },
//     { region: '성동구', lat: 37.5635, lng: 127.0368, price: 110000, tier: 3 },
// ];

// // 색상 팔레트
// const TIER_COLOR = {
//     1: '#22c55e',  // 초록 — 진입 가능
//     2: '#eab308',  // 노랑 — 3년 내 가능
//     3: '#a855f7',  // 보라 — 장기 목표
// };
// const TIER_LABEL = {
//     1: '진입 가능',
//     2: '3년 내 가능',
//     3: '장기 목표',
// };

// // 평형별 가격 배수
// const SIZE_MULTIPLIER = {
//     '20평형대': 1.0,
//     '30평형대': 1.35,
//     '40평형대 이상': 1.75,
// };
// // 연식별 가격 배수
// const AGE_MULTIPLIER = {
//     '신축 (5년 이내)': 1.2,
//     '구축 (10년 이상)': 1.0,
// };

// // 버블 크기
// const TIER_SIZE = { 1: 78, 2: 96, 3: 112 };

// export default function MapScreen() {
//     const { userProfile, simConfig, apiPrices, setApiPrices } = useAppStore();
//     const [tradeType, setTradeType] = useState('매매'); // '매매' | '전세'
//     const [selectedSize, setSelectedSize] = useState('20평형대');
//     const [selectedAge, setSelectedAge] = useState('구축 (10년 이상)');
//     const [zoomLevel, setZoomLevel] = useState(8);
//     const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
//     const mapRef = useRef(null);
//     const [isFilterOpen, setIsFilterOpen] = useState(false);
//     const [selectedRegion, setSelectedRegion] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [loadingStatus, setLoadingStatus] = useState({ text: '데이터 연결 중...', progress: 0 });

//     // 선택된 지역이 바뀔 때 지도 중심 이동
//     useEffect(() => {
//         if (selectedRegion) {
//             setMapCenter({ lat: selectedRegion.lat, lng: selectedRegion.lng });
//         }
//     }, [selectedRegion]);

//     const hasAttemptedFetch = useRef(false);

//     useEffect(() => {
//         if (apiPrices !== null) {
//             setIsLoading(false);
//             return;
//         }
//         if (hasAttemptedFetch.current) return;

//         hasAttemptedFetch.current = true;
//         let isMounted = true;

//         async function fetchPrices() {
//             setIsLoading(true);
//             try {
//                 const prices = await loadSeoulAptPrices((status) => {
//                     if (isMounted) setLoadingStatus(status);
//                 });
//                 setApiPrices(prices || {});
//             } catch (err) {
//                 console.error(err);
//                 setApiPrices({});
//             }
//         }

//         fetchPrices();
//         return () => { isMounted = false; };
//     }, [apiPrices, setApiPrices]);

//     // 사용자 자산 기반 가용 자금 계산
//     const userCash = userProfile.cash || 25000;
//     const targetAmount = userProfile.targetAmount || 90000;
//     const totalAsset = useMemo(() => {
//         // 선택된 지역이 있으면 해당 지역 가격 기준, 없으면 프로필의 목표가 기준
//         const baseForLoan = displayRegion ? (tradeType === '매매' ? displayRegion.adjustedPrice : displayRegion.adjustedRent) : targetAmount;
//         const ltv = tradeType === '매매' ? (simConfig.ltvRatio ?? 0.5) : 0.8;
//         const loanable = baseForLoan * ltv;
//         return userCash + loanable;
//     }, [userCash, targetAmount, simConfig.ltvRatio, tradeType, displayRegion]);

//     // 필터 적용 후 지역 목록 및 D-Day 동적 계산
//     const regions = useMemo(() => {
//         const sizeMul = SIZE_MULTIPLIER[selectedSize] ?? 1;
//         const ageMul = AGE_MULTIPLIER[selectedAge] ?? 1;

//         return ALL_REGIONS.map((r) => {
//             let basePrice = r.price;
//             let baseRent = Math.round(r.price * 0.6); // 기본 전세가율 60% 모의

//             if (apiPrices && apiPrices[r.region]) {
//                 const apiData = apiPrices[r.region];
//                 // apiData가 null이 아닌 객체인지 확인
//                 if (apiData && typeof apiData === 'object') {
//                     basePrice = apiData.trade || basePrice;
//                     baseRent = apiData.rent || baseRent;
//                 } else if (typeof apiData === 'number') {
//                     basePrice = apiData;
//                 }
//             }

//             const adjustedPrice = Math.round(basePrice * sizeMul * ageMul);
//             const adjustedRent = Math.round(baseRent * sizeMul * ageMul);

//             const ltvRatio = tradeType === '매매' ? (simConfig.ltvRatio ?? 0.5) : 0.8;
//             const taxRate = tradeType === '매매' ? (simConfig.acquisitionTaxRate ?? 0.035) : 0.0;
//             const targetVal = tradeType === '매매' ? adjustedPrice : adjustedRent;

//             const required = targetVal * (1 - ltvRatio) + targetVal * taxRate;
//             const gap = Math.max(0, required - userCash);

//             // 골든크로스 계산 (입력된 profile 기반)
//             let days = 0;
//             if (gap > 0) {
//                 if (userProfile.monthlySavings > 0) {
//                     const customSimConfig = tradeType === '매매'
//                         ? simConfig
//                         : { ...simConfig, ltvRatio: 0.8, acquisitionTaxRate: 0.0 };

//                     const cross = calcGoldenCross(
//                         { ...userProfile, targetAmount: targetVal },
//                         customSimConfig
//                     );
//                     days = cross ? cross.months * 30 : 99999;
//                 } else {
//                     // 저축액 미입력 → 진입 불가로 처리
//                     days = 99999;
//                 }
//             }

//             // tier 재계산: 사용자 자산 기준
//             let tier;
//             if (gap === 0) tier = 1;
//             else if (days <= 365 * 3) tier = 2;
//             else tier = 3;

//             // NaN 방지
//             const safeAdjustedPrice = isNaN(adjustedPrice) ? r.price : adjustedPrice;
//             const safeAdjustedRent = isNaN(adjustedRent) ? Math.round(r.price * 0.6) : adjustedRent;

//             return { ...r, adjustedPrice: safeAdjustedPrice, adjustedRent: safeAdjustedRent, gap, days, tier };
//         });
//     }, [selectedSize, selectedAge, userCash, userProfile, simConfig, apiPrices, tradeType]);

//     // 선택된 지역 초기화 (필터 변경 시)
//     const displayRegion = selectedRegion
//         ? regions.find((r) => r.region === selectedRegion.region) ?? regions[0]
//         : null;

//     // 지역 검색 핸들러
//     const handleSearch = (keyword) => {
//         if (!keyword) return;
//         const target = regions.find(r => r.region.includes(keyword));
//         if (target) {
//             setSelectedRegion(target);
//             setZoomLevel(6);
//         } else {
//             alert('해당 지역을 찾을 수 없습니다.');
//         }
//     };

//     return (
//         <div className="flex flex-col min-h-screen overflow-x-hidden">
//             <Header showSearch={true} onSearch={handleSearch} />

//             {/* ── API 로딩 오버레이 ── */}
//             {isLoading && (
//                 <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6" aria-live="polite">
//                     <div className="w-full max-w-md flex flex-col items-center gap-6">
//                         <div className="relative">
//                             <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
//                             <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0" />
//                             <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">
//                                 {loadingStatus.progress}%
//                             </div>
//                         </div>
//                         <div className="text-center">
//                             <p className="font-bold text-xl mb-3">{loadingStatus.text}</p>
//                             {/* Progress Bar */}
//                             <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
//                                 <div
//                                     className="h-full bg-primary transition-all duration-300 ease-out"
//                                     style={{ width: `${loadingStatus.progress}%` }}
//                                 />
//                             </div>
//                             <p className="text-sm text-slate-400 leading-relaxed">
//                                 최근 3개월 서울 실거래가 데이터를 분석하고 있습니다.<br />
//                                 초기에만 최대 10~15초가 소요되며, 이후에는 캐시로 빠르게 로드됩니다.
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             <main className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6">

//                 {/* ── 모바일 헤더 & 필터 토글 ── */}
//                 <div className="lg:hidden flex justify-between items-center px-1">
//                     <h2 className="text-lg font-bold">타겟팅 맵</h2>
//                     <button
//                         onClick={() => setIsFilterOpen(!isFilterOpen)}
//                         className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium shadow-sm hover:border-primary transition-colors"
//                         aria-label="필터 패널 열기"
//                     >
//                         <span className="material-symbols-outlined !text-[18px]">tune</span>
//                         필터
//                     </button>
//                 </div>

//                 {/* ── 배경 오버레이 (모바일 필터 오픈 시) ── */}
//                 {isFilterOpen && (
//                     <div
//                         className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
//                         onClick={() => setIsFilterOpen(false)}
//                         aria-hidden="true"
//                     />
//                 )}

//                 {/* ── 사이드패널 ── */}
//                 <aside
//                     className={`
//                         w-full lg:w-[300px] xl:w-[340px] flex flex-col gap-4 shrink-0 z-40
//                         transition-transform duration-300 ease-in-out
//                         ${isFilterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
//                         fixed lg:relative bottom-0 left-0 right-0
//                         bg-white dark:bg-slate-900 lg:bg-transparent
//                         pt-0 p-5 lg:p-0 rounded-t-3xl lg:rounded-none
//                         shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:shadow-none
//                         max-h-[88vh] lg:max-h-none overflow-y-auto lg:overflow-visible
//                         ${!isFilterOpen ? 'hidden lg:flex lg:flex-col' : 'flex flex-col bottom-sheet-handle'}
//                     `}
//                 >
//                     {/* 컨트롤 패널 카드 */}
//                     <div className="card p-4 sm:p-5 flex flex-col gap-4 text-left">
//                         {/* 데스크탑 타이틀 */}
//                         <div className="hidden lg:block">
//                             <h2 className="text-xl font-bold mb-0.5">타겟팅 맵</h2>
//                             <p className="text-xs text-slate-500 dark:text-slate-400">내 자산 기준 서울 25개 구 진입 가능성 분석</p>
//                         </div>

//                         {/* 자산 요약 */}
//                         <div className="grid grid-cols-2 gap-2.5">
//                             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-0.5 transition-transform cursor-default">
//                                 <p className="text-xs text-slate-500 mb-1 font-medium">보유 현금</p>
//                                 <p className="text-base font-bold hover:text-primary transition-colors">{formatKRW(userCash)}</p>
//                             </div>
//                             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-0.5 transition-transform cursor-default">
//                                 <p className="text-xs text-slate-500 mb-1 font-medium">대출 한도 (LTV {tradeType === '매매' ? ((simConfig.ltvRatio ?? 0.5) * 100).toFixed(0) : '80'}%)</p>
//                                 <p className="text-base font-bold hover:text-primary transition-colors">
//                                     {formatKRW(
//                                         (displayRegion ? (tradeType === '매매' ? displayRegion.adjustedPrice : displayRegion.adjustedRent) : targetAmount) *
//                                         (tradeType === '매매' ? (simConfig.ltvRatio ?? 0.5) : 0.8)
//                                     )}
//                                 </p>
//                             </div>
//                             <div className="col-span-2 bg-secondary/20 dark:bg-primary/10 p-3 rounded-lg border border-secondary/30 hover:scale-[1.01] transition-transform cursor-default">
//                                 <p className="text-xs text-primary font-semibold mb-1">총 가용 자산</p>
//                                 <p className="text-xl font-bold text-primary">{formatKRW(totalAsset)}</p>
//                             </div>
//                         </div>

//                         {/* 필터 */}
//                         <div className="flex flex-col gap-4">
//                             <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-2">필터 설정</h3>
//                             {/* 거래 유형 */}
//                             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
//                                 {['매매', '전세'].map((type) => (
//                                     <button
//                                         key={type}
//                                         onClick={() => { setTradeType(type); setSelectedRegion(null); }}
//                                         className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all duration-200 ${tradeType === type
//                                             ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
//                                             : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
//                                             }`}
//                                     >
//                                         {type}
//                                     </button>
//                                 ))}
//                             </div>
//                             {/* 평형대 */}
//                             <div>
//                                 <label className="text-xs font-medium text-slate-500 block mb-2">평형대</label>
//                                 <div className="flex flex-wrap gap-2">
//                                     {Object.keys(SIZE_MULTIPLIER).map((size) => (
//                                         <button
//                                             key={size}
//                                             onClick={() => { setSelectedSize(size); setSelectedRegion(null); }}
//                                             className={`interactive-element px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors ${selectedSize === size
//                                                 ? 'bg-primary text-slate-900 border-primary'
//                                                 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:border-primary'
//                                                 }`}
//                                         >
//                                             {size}
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>
//                             {/* 연식 */}
//                             <div>
//                                 <label className="text-xs font-medium text-slate-500 block mb-2">연식</label>
//                                 <div className="flex flex-wrap gap-2">
//                                     {Object.keys(AGE_MULTIPLIER).map((age) => (
//                                         <button
//                                             key={age}
//                                             onClick={() => { setSelectedAge(age); setSelectedRegion(null); }}
//                                             className={`interactive-element px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-colors ${selectedAge === age
//                                                 ? 'bg-primary text-slate-900 border-primary'
//                                                 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-primary hover:border-primary'
//                                                 }`}
//                                         >
//                                             {age}
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* 범례 */}
//                             <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
//                                 <label className="text-xs font-medium text-slate-500 block mb-2">가능성 범례</label>
//                                 <ul className="space-y-2 text-xs">
//                                     {[
//                                         { color: 'bg-status-green', hex: '#22c55e', label: '즉시 진입 가능 (자산 충족)' },
//                                         { color: 'bg-status-yellow', hex: '#eab308', label: '3년 내 진입 가능' },
//                                         { color: 'bg-status-purple', hex: '#a855f7', label: '장기 전략 필요 (3년 초과)' },
//                                     ].map(({ color, label }) => (
//                                         <li key={label} className="flex items-center gap-2 hover:translate-x-1 transition-transform cursor-default">
//                                             <span className={`w-3 h-3 rounded-full ${color} opacity-90 shadow-sm shrink-0`} />
//                                             <span className="text-slate-700 dark:text-slate-300">{label}</span>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </div>
//                         </div>

//                         {/* 모바일 닫기 버튼 */}
//                         {isFilterOpen && (
//                             <button
//                                 onClick={() => setIsFilterOpen(false)}
//                                 className="w-full bg-primary text-slate-900 font-bold py-3 rounded-lg text-sm lg:hidden mt-1 hover:bg-primary/90 transition-colors"
//                             >
//                                 결과 보기 ({regions.filter(r => r.tier === 1).length}개 즉시 진입 가능)
//                             </button>
//                         )}
//                     </div>

//                     {/* 선택 지역 정보 카드 (데스크탑) */}
//                     {displayRegion && (
//                         <div className="card p-4 border-l-4 border-primary hidden lg:block text-left animate-fade-in">
//                             <div className="flex items-start gap-2">
//                                 <span
//                                     className="material-symbols-outlined !text-base mt-0.5 shrink-0"
//                                     style={{ color: TIER_COLOR[displayRegion.tier] }}
//                                 >
//                                     location_on
//                                 </span>
//                                 <div className="flex-1 min-w-0">
//                                     <div className="flex items-center gap-2 mb-1">
//                                         <h4 className="text-sm font-bold">{displayRegion.region}</h4>
//                                         <span
//                                             className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
//                                             style={{ background: TIER_COLOR[displayRegion.tier] }}
//                                         >
//                                             {TIER_LABEL[displayRegion.tier]}
//                                         </span>
//                                     </div>
//                                     <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-center">
//                                         <span className={tradeType === '매매' ? 'text-slate-800 dark:text-slate-200 font-bold' : 'opacity-50'}>
//                                             매매: {formatKRW(displayRegion.adjustedPrice)}
//                                         </span>
//                                         <span className="mx-2 text-slate-300">|</span>
//                                         <span className={tradeType === '전세' ? 'text-slate-800 dark:text-slate-200 font-bold' : 'opacity-50'}>
//                                             전세: {formatKRW(displayRegion.adjustedRent)}
//                                         </span>
//                                     </p>
//                                     {displayRegion.gap > 0 ? (
//                                         <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
//                                             부족 금액: <strong className="text-red-500">{formatKRW(displayRegion.gap)}</strong>
//                                         </p>
//                                     ) : (
//                                         <p className="text-xs text-status-green font-semibold mt-0.5">✓ 현재 자산으로 즉시 진입 가능!</p>
//                                     )}
//                                     {displayRegion.days > 0 && displayRegion.days < 9999 && (
//                                         <p className="text-xs text-slate-500 mt-0.5">
//                                             예상 달성: <strong className="text-primary">D-{displayRegion.days.toLocaleString()}일</strong>
//                                         </p>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* 통계 요약 (데스크탑) */}
//                     <div className="card p-4 hidden lg:block text-left">
//                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">현황 요약</h4>
//                         <div className="grid grid-cols-3 gap-2 text-center">
//                             {[
//                                 { label: '즉시 가능', count: regions.filter(r => r.tier === 1).length, color: 'text-status-green' },
//                                 { label: '3년 내', count: regions.filter(r => r.tier === 2).length, color: 'text-status-yellow' },
//                                 { label: '장기 목표', count: regions.filter(r => r.tier === 3).length, color: 'text-status-purple' },
//                             ].map(({ label, count, color }) => (
//                                 <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
//                                     <p className={`text-xl font-black ${color}`}>{count}</p>
//                                     <p className="text-xs text-slate-500 mt-0.5">{label}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </aside>

//                 {/* ── 맵 영역 ── */}
//                 <section
//                     className="flex-1 relative rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950"
//                     style={{ minHeight: '65vh' }}
//                     aria-label="서울 지역별 부동산 진입 가능성 맵"
//                 >
//                     {!window.kakao || !window.kakao.maps ? (
//                         <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
//                             <div className="flex flex-col items-center gap-2">
//                                 <span className="material-symbols-outlined animate-spin shadow-sm text-3xl">refresh</span>
//                                 <p className="text-sm font-semibold">지도 엔진을 불러오는 중입니다...</p>
//                                 <p className="text-xs opacity-60">잠시만 기다려 주세요.</p>
//                             </div>
//                         </div>
//                     ) : (
//                         <Map
//                             center={mapCenter}
//                             style={{ width: '100%', height: '100%', minHeight: '65vh' }}
//                             level={zoomLevel}
//                             onZoomChanged={(map) => setZoomLevel(map.getLevel())}
//                             onDragEnd={(map) => setMapCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() })}
//                             ref={mapRef}
//                         >
//                             <ZoomControl position={"TOPRIGHT"} />

//                             {regions.map((pt) => {
//                                 const color = TIER_COLOR[pt.tier];
//                                 const size = TIER_SIZE[pt.tier] * (zoomLevel > 7 ? 0.6 : 1);
//                                 const isSelected = displayRegion?.region === pt.region;
//                                 return (
//                                     <CustomOverlayMap
//                                         key={pt.region}
//                                         position={{ lat: pt.lat, lng: pt.lng }}
//                                         yAnchor={0.5}
//                                         xAnchor={0.5}
//                                         zIndex={isSelected ? 100 : pt.tier === 1 ? 30 : 20}
//                                     >
//                                         <div
//                                             className="cursor-pointer group relative"
//                                             onClick={(e) => { e.stopPropagation(); setSelectedRegion(pt); }}
//                                             onKeyDown={(e) => e.key === 'Enter' && setSelectedRegion(pt)}
//                                             role="button"
//                                             tabIndex={0}
//                                         >
//                                             <div
//                                                 className={`rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg relative
//                                                     ${pt.tier === 3 ? 'animate-pulse-slow' : ''}
//                                                     ${isSelected ? 'ring-2 ring-white dark:ring-slate-300 scale-110' : ''}
//                                                 `}
//                                                 style={{
//                                                     width: size,
//                                                     height: size,
//                                                     background: `${color}1a`,
//                                                     border: `2px solid ${color}70`,
//                                                 }}
//                                             >
//                                                 <div className="flex flex-col items-center gap-0.5">
//                                                     <span className="material-symbols-outlined drop-shadow-md" style={{ color, fontSize: size > 60 ? '18px' : '14px' }}>
//                                                         location_on
//                                                     </span>
//                                                     {size > 50 && (
//                                                         <span
//                                                             className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 bg-white/85 dark:bg-slate-900/85 px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm whitespace-nowrap leading-tight"
//                                                         >
//                                                             {pt.region}
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div className="absolute -translate-x-1/2 left-1/2 bottom-full mb-2 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-250 text-left z-30 min-w-[140px] pointer-events-none">
//                                                 <div className="flex items-center gap-1 mb-1.5">
//                                                     <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
//                                                     <span className="font-bold text-slate-800 dark:text-slate-100">{pt.region}</span>
//                                                     <span className="ml-auto font-medium text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>
//                                                         {TIER_LABEL[pt.tier]}
//                                                     </span>
//                                                 </div>
//                                                 <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
//                                                     <p className={tradeType === '매매' ? 'text-slate-800 dark:text-slate-200 font-bold' : 'opacity-50'}>
//                                                         매매: {formatKRW(pt.adjustedPrice)}
//                                                     </p>
//                                                     <p className={tradeType === '전세' ? 'text-slate-800 dark:text-slate-200 font-bold' : 'opacity-50'}>
//                                                         전세: {formatKRW(pt.adjustedRent)}
//                                                     </p>
//                                                     {pt.gap > 0 && (
//                                                         <p>부족분: <strong className="text-red-500">{formatKRW(pt.gap)}</strong></p>
//                                                     )}
//                                                     <p className="font-medium" style={{ color }}>
//                                                         {pt.days === 0 ? '즉시 진입 가능 ✓' : pt.days >= 9999 ? '장기 계획 필요' : `D-${pt.days.toLocaleString()}일`}
//                                                     </p>
//                                                 </div>
//                                                 <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 rotate-45" />
//                                             </div>
//                                         </div>
//                                     </CustomOverlayMap>
//                                 );
//                             })}
//                         </Map>
//                     )}

//                     {/* 하단 D-Day / 선택 지역 배너 */}
//                     <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
//                         <div
//                             className="bg-slate-900/95 dark:bg-slate-900 backdrop-blur-md text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-xl flex items-center justify-between gap-3 border border-slate-700/50 hover:-translate-y-1 transition-transform cursor-default"
//                         >
//                             <div className="flex items-center gap-2">
//                                 <span className="material-symbols-outlined text-primary !text-base shrink-0">schedule</span>
//                                 <span className="text-xs sm:text-sm font-medium truncate">
//                                     {displayRegion ? `${displayRegion.region} 진입까지` : '지역을 선택하세요'}
//                                 </span>
//                             </div>
//                             <span className="text-sm sm:text-base font-bold text-primary shrink-0">
//                                 {displayRegion
//                                     ? displayRegion.days === 0
//                                         ? '즉시 가능 ✓'
//                                         : displayRegion.days >= 9999
//                                             ? '장기 계획'
//                                             : `D-${displayRegion.days.toLocaleString()}일`
//                                     : '—'
//                                 }
//                             </span>
//                         </div>
//                     </div>

//                     {/* 현황 통계 배지 (모바일 소형) */}
//                     <div className="absolute top-3 left-3 flex gap-1.5 z-20 lg:hidden">
//                         {[
//                             { label: regions.filter(r => r.tier === 1).length, color: '#22c55e' },
//                             { label: regions.filter(r => r.tier === 2).length, color: '#eab308' },
//                             { label: regions.filter(r => r.tier === 3).length, color: '#a855f7' },
//                         ].map(({ label, color }, i) => (
//                             <span
//                                 key={i}
//                                 className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
//                                 style={{ background: color }}
//                             >
//                                 {label}
//                             </span>
//                         ))}
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }

import { useState, useMemo, useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { formatKRW, calcGoldenCross } from '../utils/calculator';
import { loadSeoulAptPrices } from '../services/api';
import { Map, CustomOverlayMap, ZoomControl } from 'react-kakao-maps-sdk';

// ── 데이터 및 상수 설정 ────────────────────────────────────────
const ALL_REGIONS = [
    { region: '은평구', lat: 37.6027, lng: 126.9291, price: 61000, tier: 1 },
    { region: '서대문구', lat: 37.5791, lng: 126.9368, price: 68000, tier: 1 },
    { region: '마포구', lat: 37.5662, lng: 126.9016, price: 79000, tier: 2 },
    { region: '종로구', lat: 37.5730, lng: 126.9794, price: 84000, tier: 2 },
    { region: '중구', lat: 37.5637, lng: 126.9976, price: 81000, tier: 2 },
    { region: '용산구', lat: 37.5325, lng: 126.9900, price: 130000, tier: 3 },
    { region: '노원구', lat: 37.6542, lng: 127.0568, price: 57000, tier: 1 },
    { region: '도봉구', lat: 37.6688, lng: 127.0471, price: 54000, tier: 1 },
    { region: '강북구', lat: 37.6396, lng: 127.0257, price: 53000, tier: 1 },
    { region: '성북구', lat: 37.5894, lng: 127.0167, price: 67000, tier: 1 },
    { region: '동대문구', lat: 37.5744, lng: 127.0400, price: 69000, tier: 2 },
    { region: '중랑구', lat: 37.6063, lng: 127.0926, price: 61000, tier: 1 },
    { region: '광진구', lat: 37.5385, lng: 127.0824, price: 82000, tier: 2 },
    { region: '강서구', lat: 37.5509, lng: 126.8495, price: 66000, tier: 1 },
    { region: '양천구', lat: 37.5169, lng: 126.8660, price: 74000, tier: 2 },
    { region: '구로구', lat: 37.4954, lng: 126.8874, price: 62000, tier: 1 },
    { region: '금천구', lat: 37.4568, lng: 126.8954, price: 58000, tier: 1 },
    { region: '영등포구', lat: 37.5259, lng: 126.8966, price: 86000, tier: 2 },
    { region: '동작구', lat: 37.5124, lng: 126.9393, price: 88000, tier: 2 },
    { region: '관악구', lat: 37.4782, lng: 126.9515, price: 72000, tier: 1 },
    { region: '서초구', lat: 37.4837, lng: 127.0324, price: 158000, tier: 3 },
    { region: '강남구', lat: 37.5172, lng: 127.0473, price: 192000, tier: 3 },
    { region: '송파구', lat: 37.5145, lng: 127.1066, price: 132000, tier: 3 },
    { region: '강동구', lat: 37.5301, lng: 127.1238, price: 94000, tier: 2 },
    { region: '성동구', lat: 37.5635, lng: 127.0368, price: 110000, tier: 3 },
];

const TIER_COLOR = { 1: '#22c55e', 2: '#eab308', 3: '#a855f7' };
const TIER_LABEL = { 1: '진입 가능', 2: '3년 내 가능', 3: '장기 목표' };
const SIZE_MULTIPLIER = { '20평형대': 1.0, '30평형대': 1.35, '40평형대 이상': 1.75 };
const AGE_MULTIPLIER = { '신축 (5년 이내)': 1.2, '구축 (10년 이상)': 1.0 };
const TIER_SIZE = { 1: 78, 2: 96, 3: 112 };

export default function MapScreen() {
    const { userProfile, simConfig, apiPrices, setApiPrices } = useAppStore();

    // UI 상태
    const [tradeType, setTradeType] = useState('매매');
    const [selectedSize, setSelectedSize] = useState('20평형대');
    const [selectedAge] = useState('구축 (10년 이상)');
    const [zoomLevel, setZoomLevel] = useState(8);
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState({ text: '데이터 연결 중...', progress: 0 });

    const hasAttemptedFetch = useRef(false);

    // ── 데이터 로딩 ──
    useEffect(() => {
        if (apiPrices !== null || hasAttemptedFetch.current) return;

        hasAttemptedFetch.current = true;
        let isMounted = true;

        async function fetchPrices() {
            setIsLoading(true);
            try {
                const prices = await loadSeoulAptPrices((status) => {
                    if (isMounted) setLoadingStatus(status);
                });
                if (isMounted) setApiPrices(prices || {});
            } catch (err) {
                console.error(err);
                if (isMounted) setApiPrices({});
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchPrices();
        return () => { isMounted = false; };
    }, [apiPrices, setApiPrices]);

    // ── 핵심 계산 로직 (순서 중요) ──

    // 1. 모든 지역의 현재 필터 기준 가격 및 D-Day 계산
    const regions = useMemo(() => {
        const sizeMul = SIZE_MULTIPLIER[selectedSize] ?? 1;
        const ageMul = AGE_MULTIPLIER[selectedAge] ?? 1;
        const userCash = userProfile.cash || 25000;

        return ALL_REGIONS.map((r) => {
            let basePrice = r.price;
            let baseRent = Math.round(r.price * 0.6);

            // API 데이터 매핑
            const apiData = apiPrices?.[r.region];
            if (apiData) {
                if (typeof apiData === 'object') {
                    basePrice = apiData.trade || basePrice;
                    baseRent = apiData.rent || baseRent;
                } else if (typeof apiData === 'number') {
                    basePrice = apiData;
                }
            }

            const adjustedPrice = Math.round(basePrice * sizeMul * ageMul);
            const adjustedRent = Math.round(baseRent * sizeMul * ageMul);

            const ltvRatio = tradeType === '매매' ? (simConfig.ltvRatio ?? 0.5) : 0.8;
            const taxRate = tradeType === '매매' ? (simConfig.acquisitionTaxRate ?? 0.035) : 0.0;
            const targetVal = tradeType === '매매' ? adjustedPrice : adjustedRent;

            const required = targetVal * (1 - ltvRatio) + targetVal * taxRate;
            const gap = Math.max(0, required - userCash);

            let days = 0;
            if (gap > 0) {
                if (userProfile.monthlySavings > 0) {
                    const customSimConfig = tradeType === '매매'
                        ? simConfig
                        : { ...simConfig, ltvRatio: 0.8, acquisitionTaxRate: 0.0 };
                    const cross = calcGoldenCross({ ...userProfile, targetAmount: targetVal }, customSimConfig);
                    days = cross ? cross.months * 30 : 99999;
                } else {
                    days = 99999;
                }
            }

            let tier = gap === 0 ? 1 : days <= 1095 ? 2 : 3;

            return {
                ...r,
                adjustedPrice,
                adjustedRent,
                gap,
                days,
                tier
            };
        });
    }, [selectedSize, selectedAge, userProfile, simConfig, apiPrices, tradeType]);

    // 2. 현재 선택된 지역의 최신 정보 추출
    const displayRegion = useMemo(() => {
        if (!selectedRegion) return null;
        return regions.find((r) => r.region === selectedRegion.region) || null;
    }, [selectedRegion, regions]);

    // 3. 자산 기반 가용 자금 계산 (displayRegion 참조)
    const totalAsset = useMemo(() => {
        const userCash = userProfile.cash || 25000;
        const targetAmount = userProfile.targetAmount || 90000;
        const baseForLoan = displayRegion
            ? (tradeType === '매매' ? displayRegion.adjustedPrice : displayRegion.adjustedRent)
            : targetAmount;
        const ltv = tradeType === '매매' ? (simConfig.ltvRatio ?? 0.5) : 0.8;
        return userCash + (baseForLoan * ltv);
    }, [userProfile.cash, userProfile.targetAmount, simConfig.ltvRatio, tradeType, displayRegion]);

    // ── 핸들러 ──
    const handleSearch = (keyword) => {
        if (!keyword) return;
        const target = regions.find(r => r.region.includes(keyword));
        if (target) {
            setSelectedRegion(target);
            setMapCenter({ lat: target.lat, lng: target.lng });
            setZoomLevel(6);
        } else {
            alert('해당 지역을 찾을 수 없습니다.');
        }
    };

    return (
        <div className="flex flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

            {/* 로딩 오버레이 */}
            {isLoading && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6">
                    <div className="w-full max-w-md flex flex-col items-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="w-full h-full border-4 border-primary/20 rounded-full" />
                            <div className="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0" />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-primary">
                                {loadingStatus.progress}%
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-xl mb-3">{loadingStatus.text}</p>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${loadingStatus.progress}%` }} />
                            </div>
                            <p className="text-sm text-slate-400">최근 서울 실거래가 데이터를 분석 중입니다.</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col lg:row max-w-[1440px] w-full mx-auto p-4 lg:p-6 gap-6 lg:flex-row">

                {/* 사이드바 필터 패널 */}
                <aside className={`
                    w-full lg:w-[340px] flex flex-col gap-4 shrink-0 z-40
                    fixed lg:relative bottom-0 left-0 right-0 
                    bg-white dark:bg-slate-900 lg:bg-transparent
                    p-5 lg:p-0 rounded-t-3xl lg:rounded-none shadow-2xl lg:shadow-none
                    transition-transform duration-300
                    ${isFilterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
                    ${!isFilterOpen && 'hidden lg:flex'}
                `}>
                    <div className="card p-5 space-y-6">
                        <header className="hidden lg:block">
                            <h2 className="text-xl font-bold">타겟팅 맵</h2>
                            <p className="text-xs text-slate-500">내 자산 기준 서울 25개 구 분석</p>
                            <div className="relative mt-3 group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">
                                    search
                                </span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/50 text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all duration-300"
                                    placeholder="지역 검색 (예: 마포구)"
                                    type="text"
                                    aria-label="지역 검색"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch(e.target.value);
                                    }}
                                />
                            </div>
                        </header>

                        {/* 자산 요약 */}
                        <section className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">보유 현금</p>
                                <p className="text-sm font-bold">{formatKRW(userProfile.cash || 25000)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">대출 한도</p>
                                <p className="text-sm font-bold">
                                    {formatKRW(totalAsset - (userProfile.cash || 25000))}
                                </p>
                            </div>
                            <div className="col-span-2 bg-primary/10 p-3 rounded-xl border border-primary/20">
                                <p className="text-[10px] text-primary font-bold uppercase tracking-tight">총 가용 자산 (대출포함)</p>
                                <p className="text-lg font-black text-primary">{formatKRW(totalAsset)}</p>
                            </div>
                        </section>

                        {/* 필터 설정 */}
                        <section className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">거래 유형</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    {['매매', '전세'].map(t => (
                                        <button key={t} onClick={() => setTradeType(t)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tradeType === t ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase">평형대 선택</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(SIZE_MULTIPLIER).map(s => (
                                        <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedSize === s ? 'bg-primary border-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <button onClick={() => setIsFilterOpen(false)} className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl text-sm lg:hidden hover:brightness-95">
                            결과 확인하기
                        </button>
                    </div>

                    {/* 선택 지역 상세 카드 (데스크탑 전용) */}
                    {displayRegion && (
                        <div className="card p-4 border-l-4 border-primary animate-in slide-in-from-left-2 duration-300 hidden lg:block">
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-bold text-lg">{displayRegion.region}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold" style={{ background: TIER_COLOR[displayRegion.tier] }}>
                                    {TIER_LABEL[displayRegion.tier]}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">예상 시세</span>
                                    <span className="font-bold">{formatKRW(tradeType === '매매' ? displayRegion.adjustedPrice : displayRegion.adjustedRent)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">부족 자금</span>
                                    <span className={displayRegion.gap > 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                        {displayRegion.gap > 0 ? formatKRW(displayRegion.gap) : '즉시 가능'}
                                    </span>
                                </div>
                                {displayRegion.gap > 0 && (
                                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                        <span className="text-slate-500">목표 달성일</span>
                                        <span className="text-primary font-black uppercase tracking-tighter">
                                            {displayRegion.days >= 9999 ? '계획 필요' : `D-${displayRegion.days.toLocaleString()}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </aside>

                {/* 지도 영역 */}
                <section className="flex-1 relative rounded-3xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 min-h-[500px] lg:min-h-0 bg-slate-100">
                    {!window.kakao?.maps ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">refresh</span>
                            <p className="text-sm font-medium text-slate-400">지도를 불러오고 있습니다...</p>
                        </div>
                    ) : (
                        <Map
                            center={mapCenter}
                            style={{ width: '100%', height: '100%' }}
                            level={zoomLevel}
                            onZoomChanged={(m) => setZoomLevel(m.getLevel())}
                            onDragEnd={(m) => setMapCenter({ lat: m.getCenter().getLat(), lng: m.getCenter().getLng() })}
                        >
                            <ZoomControl position="TOPRIGHT" />
                            {regions.map((pt) => {
                                const isSelected = displayRegion?.region === pt.region;
                                const size = TIER_SIZE[pt.tier] * (zoomLevel > 7 ? 0.7 : 1);
                                return (
                                    <CustomOverlayMap key={pt.region} position={{ lat: pt.lat, lng: pt.lng }} zIndex={isSelected ? 50 : 10}>
                                        <div
                                            onClick={() => setSelectedRegion(pt)}
                                            className={`group relative cursor-pointer flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                                            style={{
                                                width: size, height: size,
                                                background: `${TIER_COLOR[pt.tier]}20`,
                                                border: `2px solid ${TIER_COLOR[pt.tier]}80`,
                                                borderRadius: '50%'
                                            }}
                                        >
                                            <div className="text-center">
                                                <span className="material-symbols-outlined block" style={{ color: TIER_COLOR[pt.tier], fontSize: size * 0.3 }}>location_on</span>
                                                <span className="text-[10px] font-black dark:text-white bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded shadow-sm">
                                                    {pt.region}
                                                </span>
                                            </div>

                                            {/* 호버 툴팁 */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white p-3 rounded-xl text-xs whitespace-nowrap shadow-2xl z-50">
                                                <p className="font-bold border-b border-slate-700 pb-1 mb-1">{pt.region} ({TIER_LABEL[pt.tier]})</p>
                                                <p>시세: {formatKRW(tradeType === '매매' ? pt.adjustedPrice : pt.adjustedRent)}</p>
                                                <p className="text-primary font-bold">{pt.days === 0 ? '즉시 가능 ✓' : `D-${pt.days.toLocaleString()}`}</p>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                            </div>
                                        </div>
                                    </CustomOverlayMap>
                                );
                            })}
                        </Map>
                    )}

                    {/* 모바일 하단 플로팅 바 */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm lg:hidden z-30">
                        <button onClick={() => setIsFilterOpen(true)} className="w-full bg-slate-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">tune</span>
                                <span className="font-bold">{displayRegion ? displayRegion.region : '지역을 선택하세요'}</span>
                            </div>
                            <span className="text-primary font-black">
                                {displayRegion ? (displayRegion.days === 0 ? '즉시 가능' : `D-${displayRegion.days}`) : '필터 열기'}
                            </span>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}