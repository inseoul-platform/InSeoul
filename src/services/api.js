import { SEOUL_GU_CODES } from '../utils/regionCodes';

const MOLIT_API_BASE = import.meta.env.VITE_MOLIT_API_BASE;
const MOLIT_RENT_API_BASE = import.meta.env.VITE_MOLIT_RENT_API_BASE;
const MOLIT_API_KEY = import.meta.env.VITE_MOLIT_API_KEY;
const API_DELAY_MS = Number(import.meta.env.VITE_API_REQUEST_DELAY_MS || 200);
const CACHE_TTL_MS = Number(import.meta.env.VITE_CACHE_TTL_MS || 86400000);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRecentThreeMonths() {
    const today = new Date();
    const months = [];
    for (let i = 1; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}${m}`);
    }
    return months;
}

export async function fetchAptPricesForRegion(lawdCd, ymd, type = 'trade') {
    const baseUrl = type === 'trade' ? MOLIT_API_BASE : MOLIT_RENT_API_BASE;
    const url = `${baseUrl}?serviceKey=${MOLIT_API_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=${ymd}&numOfRows=2000&pageNo=1`;

    // 타임아웃 처리를 위한 AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const errMsg = xml.querySelector('errMsg') || xml.querySelector('returnAuthMsg');
        if (errMsg) throw new Error(errMsg.textContent);

        const items = xml.querySelectorAll('item');
        const prices = [];

        items.forEach(item => {
            if (type === 'trade') {
                const amountNode = item.querySelector('dealAmount') || item.querySelector('거래금액');
                const amountStr = amountNode?.textContent?.trim()?.replace(/,/g, '');
                if (amountStr) prices.push(Number(amountStr));
            } else {
                const monthlyNode = item.querySelector('monthlyRent');
                const monthlyRent = Number(monthlyNode?.textContent?.trim()?.replace(/,/g, '') || 0);
                if (monthlyRent === 0) {
                    const depositNode = item.querySelector('deposit') || item.querySelector('보증금액');
                    const depositStr = depositNode?.textContent?.trim()?.replace(/,/g, '');
                    if (depositStr) prices.push(Number(depositStr));
                }
            }
        });

        return prices;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error fetching ${type} data for ${lawdCd} / ${ymd}:`, error.name === 'AbortError' ? 'Timeout' : error.message);
        return [];
    }
}

export async function fetchAveragePriceForRegion(lawdCd, months, type = 'trade') {
    let allPrices = [];
    for (const ymd of months) {
        const prices = await fetchAptPricesForRegion(lawdCd, ymd, type);
        allPrices = allPrices.concat(prices);
        await delay(API_DELAY_MS);
    }

    if (allPrices.length === 0) return null;
    const sum = allPrices.reduce((a, b) => a + b, 0);
    return Math.round(sum / allPrices.length);
}

export async function loadSeoulAptPrices(onStatusUpdate) {
    const CACHE_KEY = 'inseoul_api_cache_v4';
    const cachedStr = localStorage.getItem(CACHE_KEY);

    if (cachedStr) {
        try {
            const cached = JSON.parse(cachedStr);
            if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }
        } catch (e) {
            console.error('Cache parse error', e);
        }
    }

    const months = getRecentThreeMonths();
    const result = {};
    const regionsList = Object.entries(SEOUL_GU_CODES);

    for (let i = 0; i < regionsList.length; i++) {
        const [guName, code] = regionsList[i];
        if (onStatusUpdate) {
            const progress = Math.round(((i + 1) / regionsList.length) * 100);
            onStatusUpdate({
                text: `[${i + 1}/${regionsList.length}] ${guName} 실거래 데이터 분석 중...`,
                progress
            });
        }

        const [avgTrade, avgRent] = await Promise.all([
            fetchAveragePriceForRegion(code, months, 'trade'),
            fetchAveragePriceForRegion(code, months, 'rent')
        ]);

        if (avgTrade || avgRent) {
            result[guName] = {
                trade: avgTrade || null,
                rent: avgRent || null
            };
        }
    }

    if (Object.keys(result).length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: result
        }));
    }

    return result;
}
