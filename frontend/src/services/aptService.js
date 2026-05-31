/**
 * aptService.js — 국토교통부 아파트 실거래가 API 서비스 레이어
 *
 * ✅ 검증된 엔드포인트:
 *    https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade
 *
 * ⚠️ serviceKey는 URL-Encoded 형태 그대로 사용 (encodeURIComponent 재호출 금지)
 * ⚠️ DEAL_YMD 형식: YYYYMM (6자리)
 * ⚠️ LAWD_CD: 법정동코드 앞 5자리 (예: 강남구 = 11680)
 */

const API_BASE = import.meta.env.VITE_MOLIT_API_BASE
    ?? 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';
const RENT_API_BASE = import.meta.env.VITE_MOLIT_RENT_API_BASE
    ?? 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';
const SERVICE_KEY = import.meta.env.VITE_MOLIT_API_KEY ?? '';

// 캐시 TTL (기본: 환경변수 or 24시간)
const CACHE_TTL_MS = Number(import.meta.env.VITE_CACHE_TTL_MS ?? 86400000);
const STORAGE_PREFIX = 'inseoul_apt_';

// ── XML 파서 ──────────────────────────────────────────────────────────────────

/**
 * XML 응답을 아파트 거래 배열로 파싱
 * @param {string} xmlText
 * @returns {Array<object>}
 */
function parseAptTradeXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    // 에러 체크
    const resultCode = doc.querySelector('resultCode')?.textContent?.trim();
    if (resultCode && resultCode !== '000') {
        const msg = doc.querySelector('resultMsg')?.textContent ?? '알 수 없는 오류';
        throw new Error(`API 오류 [${resultCode}]: ${msg}`);
    }

    const items = doc.querySelectorAll('item');
    return Array.from(items).map(item => ({
        aptName: item.querySelector('aptNm')?.textContent?.trim() ?? '',
        dong: item.querySelector('umdNm')?.textContent?.trim() ?? '',
        floor: Number(item.querySelector('floor')?.textContent ?? 0),
        area: parseFloat(item.querySelector('excluUseAr')?.textContent ?? '0'),
        buildYear: Number(item.querySelector('buildYear')?.textContent ?? 0),
        dealYear: Number(item.querySelector('dealYear')?.textContent ?? 0),
        dealMonth: Number(item.querySelector('dealMonth')?.textContent ?? 0),
        dealDay: Number(item.querySelector('dealDay')?.textContent ?? 0),
        // dealAmount: "389,000" → 38억 9000만 원 (만원 단위)
        dealAmount: Number(
            (item.querySelector('dealAmount')?.textContent ?? '0').replace(/,/g, '')
        ),
        sggCd: item.querySelector('sggCd')?.textContent?.trim() ?? '',
    }));
}

/**
 * XML 응답을 아파트 전월세 거래 배열로 파싱
 * @param {string} xmlText
 * @returns {Array<object>}
 */
function parseAptRentXml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const resultCode = doc.querySelector('resultCode')?.textContent?.trim();
    if (resultCode && resultCode !== '000') {
        const msg = doc.querySelector('resultMsg')?.textContent ?? '알 수 없는 오류';
        throw new Error(`API 오류 [${resultCode}]: ${msg}`);
    }

    const items = doc.querySelectorAll('item');
    return Array.from(items).map(item => ({
        aptName: item.querySelector('aptNm')?.textContent?.trim() ?? '',
        dong: item.querySelector('umdNm')?.textContent?.trim() ?? '',
        floor: Number(item.querySelector('floor')?.textContent ?? 0),
        area: parseFloat(item.querySelector('excluUseAr')?.textContent ?? '0'),
        buildYear: Number(item.querySelector('buildYear')?.textContent ?? 0),
        dealYear: Number(item.querySelector('dealYear')?.textContent ?? 0),
        dealMonth: Number(item.querySelector('dealMonth')?.textContent ?? 0),
        dealDay: Number(item.querySelector('dealDay')?.textContent ?? 0),
        deposit: Number(
            (item.querySelector('deposit')?.textContent ?? '0').replace(/,/g, '')
        ),
        monthlyRent: Number(
            (item.querySelector('monthlyRent')?.textContent ?? '0').replace(/,/g, '')
        ),
        sggCd: item.querySelector('sggCd')?.textContent?.trim() ?? '',
    }));
}

// ── 캐시 유틸 ────────────────────────────────────────────────────────────────

function cacheGet(key) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function cacheSet(key, data) {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // localStorage 용량 초과 시 무시
    }
}

// ── 핵심 API 호출 ─────────────────────────────────────────────────────────────

/**
 * 특정 구의 특정 월 아파트 실거래 목록 조회
 *
 * @param {string} lawdCd   - 법정동코드 앞 5자리 (예: '11680')
 * @param {string} dealYmd  - 거래년월 YYYYMM (예: '202502')
 * @param {number} numOfRows - 한 페이지 결과 수 (기본 100)
 * @returns {Promise<Array<object>>}
 */
export async function fetchAptTrade(lawdCd, dealYmd, numOfRows = 100) {
    const cacheKey = `${lawdCd}_${dealYmd}_${numOfRows}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        console.log(`[aptService] 캐시 히트: ${lawdCd} ${dealYmd}`);
        return cached;
    }

    // serviceKey는 이미 URL-Encoded이므로 직접 문자열에 삽입
    const url = `${API_BASE}?serviceKey=${SERVICE_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=${numOfRows}&pageNo=1`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
    }

    const xmlText = await res.text();
    const data = parseAptTradeXml(xmlText);
    cacheSet(cacheKey, data);
    return data;
}

/**
 * 특정 구의 특정 월 아파트 전월세 내역 조회
 *
 * @param {string} lawdCd
 * @param {string} dealYmd
 * @param {number} numOfRows
 * @returns {Promise<Array<object>>}
 */
export async function fetchAptRent(lawdCd, dealYmd, numOfRows = 100) {
    const cacheKey = `rent_${lawdCd}_${dealYmd}_${numOfRows}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        return cached;
    }

    const url = `${RENT_API_BASE}?serviceKey=${SERVICE_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=${numOfRows}&pageNo=1`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
    }

    const xmlText = await res.text();
    const data = parseAptRentXml(xmlText);
    cacheSet(cacheKey, data);
    return data;
}

// ── 구별 대표 시세 계산 ───────────────────────────────────────────────────────

/**
 * 거래 목록에서 면적 기준 대표 시세(만원/건) 중앙값 계산
 * @param {Array<object>} trades
 * @param {number} minArea - 최소 전용면적 (기본 60㎡ = 약 25평)
 * @param {number} maxArea - 최대 전용면적 (기본 85㎡ = 약 32평)
 * @returns {number} 만원 단위 가격 (중앙값), 거래 없으면 0
 */
export function calcMedianPrice(trades, minArea = 60, maxArea = 85) {
    const filtered = trades
        .filter(t => t.area >= minArea && t.area <= maxArea && t.dealAmount > 0)
        .map(t => t.dealAmount)
        .sort((a, b) => a - b);

    if (filtered.length === 0) return 0;
    const mid = Math.floor(filtered.length / 2);
    return filtered.length % 2 === 0
        ? Math.round((filtered[mid - 1] + filtered[mid]) / 2)
        : filtered[mid];
}

// ── 최근 N개월 평균 시세 조회 ─────────────────────────────────────────────────

/**
 * 최근 N개월 거래 데이터를 수집하여 구별 대표 시세 반환
 * @param {string} lawdCd
 * @param {number} months - 최근 몇 개월치 수집 (기본 3)
 * @returns {Promise<number>} 만원 단위 중앙값
 */
export async function fetchDistrictMedianPrice(lawdCd, months = 3) {
    const now = new Date();
    const allTrades = [];

    for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        try {
            const trades = await fetchAptTrade(lawdCd, ymd, 100);
            allTrades.push(...trades);
        } catch (e) {
            console.warn(`[aptService] ${lawdCd} ${ymd} 매매 조회 실패:`, e.message);
        }
    }

    return calcMedianPrice(allTrades);
}

/**
 * 최근 N개월 전세 데이터를 수집하여 구별 대표 전세 시세 반환
 * @param {string} lawdCd
 * @param {number} months
 * @returns {Promise<number>} 만원 단위 중앙값
 */
export async function fetchDistrictMedianJeonse(lawdCd, months = 3) {
    const now = new Date();
    const allRents = [];

    for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        try {
            const rents = await fetchAptRent(lawdCd, ymd, 100);
            // 전세만 필터링 (월세 0원)
            const jeonses = rents.filter(r => r.monthlyRent === 0 && r.deposit > 0).map(r => ({
                ...r,
                dealAmount: r.deposit // calcMedianPrice 재활용을 위해 dealAmount 필드에 보증금 매핑
            }));
            allRents.push(...jeonses);
        } catch (e) {
            console.warn(`[aptService] ${lawdCd} ${ymd} 전월세 조회 실패:`, e.message);
        }
    }

    return calcMedianPrice(allRents);
}

// ── 서울 25개 구 전체 시세 갱신 ───────────────────────────────────────────────

/**
 * 서울 25개 구 전체 대표 시세를 병렬 조회
 * (@param districts — seoulDistricts.js 의 SEOUL_DISTRICTS 배열)
 * @returns {Promise<Array<{ region, lawdCd, price }>>}
 */
export async function fetchAllDistrictPrices(districts) {
    const REQUEST_DELAY = Number(import.meta.env.VITE_API_REQUEST_DELAY_MS ?? 200);

    const results = [];
    for (const d of districts) {
        // rate limit 대응: 딜레이
        await new Promise(r => setTimeout(r, REQUEST_DELAY));
        try {
            const [price, jeonsePrice] = await Promise.all([
                fetchDistrictMedianPrice(d.lawdCd, 3),
                fetchDistrictMedianJeonse(d.lawdCd, 3)
            ]);
            results.push({
                ...d,
                price: price > 0 ? price : d.price,
                jeonsePrice: jeonsePrice > 0 ? jeonsePrice : Math.round(d.price * 0.6) // fallback 전세가율 60%
            });
        } catch {
            results.push({ ...d, jeonsePrice: Math.round(d.price * 0.6) }); // fallback: 기존 Mock 가격 유지
        }
    }
    return results;
}
