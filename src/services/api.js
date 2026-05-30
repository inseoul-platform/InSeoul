/**
 * api.js — 서울시 아파트 가격 데이터 조회
 * W7: 국토부 직접 호출 → Spring 백엔드 프록시(/api/districts/prices)로 전환
 */
import apiClient from './apiClient';

/**
 * Spring 백엔드에서 25개구 매매/전세 평균가 조회.
 * 캐시는 서버가 관리(24h TTL). 클라이언트 localStorage 캐시 제거.
 *
 * @param {function({text: string, progress: number}): void} [onStatusUpdate]
 * @returns {Promise<Object>} { 구명: { trade: number|null, rent: number|null } }
 */
export async function loadSeoulAptPrices(onStatusUpdate) {
    if (onStatusUpdate) {
        onStatusUpdate({ text: '서버에서 아파트 가격 데이터 조회 중...', progress: 50 });
    }

    const { data: response } = await apiClient.get('/api/districts/prices');
    const list = response.data ?? [];

    const result = {};
    for (const item of list) {
        if (item.tradeAvg != null || item.rentAvg != null) {
            result[item.region] = {
                trade: item.tradeAvg ? Number(item.tradeAvg) : null,
                rent: item.rentAvg ? Number(item.rentAvg) : null,
            };
        }
    }

    if (onStatusUpdate) {
        onStatusUpdate({ text: '완료', progress: 100 });
    }

    return result;
}

// 하위 호환용 재수출 (구 코드에서 named import로 사용하던 함수들은 삭제)
export { loadSeoulAptPrices as fetchAptPricesForAllDistricts };
