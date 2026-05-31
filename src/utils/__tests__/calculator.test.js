import { describe, it, expect } from 'vitest';
import {
    calcAssetGrowth,
    calcApartmentPrice,
    calcLoanAmount,
    calcAcquisitionTax,
    calcRequiredCapital,
    calcGoldenCross,
    calcInterestRateStress,
    calcPriceRiseStress,
    buildChartData,
    formatKRW,
    formatYearMonth,
} from '../calculator.js';

// ────────────────────────────────────────────────────────────────
// calcAssetGrowth
// ────────────────────────────────────────────────────────────────
describe('calcAssetGrowth', () => {
    it('수익률 0%일 때 단순 합산 반환', () => {
        // cash=1000, monthly=100, rate=0%, months=10
        // 기대값 = 1000 + 100*10 = 2000
        expect(calcAssetGrowth(1000, 100, 0, 10)).toBe(2000);
    });

    it('초기 현금만 있고 저축 없을 때 복리 계산', () => {
        // cash=10000, monthly=0, rate=12%, months=12 → 10000 * (1.01)^12
        const expected = 10000 * Math.pow(1 + 0.01, 12);
        expect(calcAssetGrowth(10000, 0, 0.12, 12)).toBeCloseTo(expected, 2);
    });

    it('months=0일 때 초기 현금 반환', () => {
        expect(calcAssetGrowth(5000, 200, 0.06, 0)).toBeCloseTo(5000, 2);
    });

    it('현금·저축·수익률 모두 양수일 때 단순 합산보다 커야 함', () => {
        const simple = 3000 + 100 * 24;
        const compound = calcAssetGrowth(3000, 100, 0.06, 24);
        expect(compound).toBeGreaterThan(simple);
    });
});

// ────────────────────────────────────────────────────────────────
// calcApartmentPrice
// ────────────────────────────────────────────────────────────────
describe('calcApartmentPrice', () => {
    it('months=0이면 현재 가격 그대로', () => {
        expect(calcApartmentPrice(80000, 0.03, 0)).toBe(80000);
    });

    it('상승률 0%이면 항상 현재 가격', () => {
        expect(calcApartmentPrice(80000, 0, 60)).toBe(80000);
    });

    it('연 3% 상승, 12개월 후 약 2424만 원 증가', () => {
        // 80000 * 1.03^1 = 82400
        expect(calcApartmentPrice(80000, 0.03, 12)).toBeCloseTo(82400, 0);
    });

    it('상승률이 높을수록 가격이 더 커야 함', () => {
        const low = calcApartmentPrice(80000, 0.02, 24);
        const high = calcApartmentPrice(80000, 0.05, 24);
        expect(high).toBeGreaterThan(low);
    });
});

// ────────────────────────────────────────────────────────────────
// calcLoanAmount
// ────────────────────────────────────────────────────────────────
describe('calcLoanAmount', () => {
    it('기본 LTV 50% 계산', () => {
        expect(calcLoanAmount(80000)).toBe(40000);
    });

    it('LTV 70% 계산', () => {
        expect(calcLoanAmount(80000, 0.7)).toBe(56000);
    });

    it('LTV 0%이면 대출 없음', () => {
        expect(calcLoanAmount(80000, 0)).toBe(0);
    });
});

// ────────────────────────────────────────────────────────────────
// calcAcquisitionTax
// ────────────────────────────────────────────────────────────────
describe('calcAcquisitionTax', () => {
    it('기본 취득세 3.5% 계산', () => {
        expect(calcAcquisitionTax(80000)).toBeCloseTo(2800, 0);
    });

    it('취득세율 1.1% 적용', () => {
        expect(calcAcquisitionTax(80000, 0.011)).toBeCloseTo(880, 0);
    });

    it('가격 0이면 취득세 0', () => {
        expect(calcAcquisitionTax(0)).toBe(0);
    });
});

// ────────────────────────────────────────────────────────────────
// calcRequiredCapital
// ────────────────────────────────────────────────────────────────
describe('calcRequiredCapital', () => {
    it('필요 자본금 = 자기자금 + 취득세', () => {
        // 80000만 원, LTV 50%, 취득세 3.5%
        // 자기자금 = 40000, 취득세 = 2800
        // 필요자본금 = 42800
        const { requiredCapital, loanAmount, tax } = calcRequiredCapital(80000, 0.5, 0.035);
        expect(loanAmount).toBe(40000);
        expect(tax).toBeCloseTo(2800, 0);
        expect(requiredCapital).toBeCloseTo(42800, 0);
    });

    it('LTV 100%이면 자기자금 없이 취득세만 필요', () => {
        const { requiredCapital } = calcRequiredCapital(80000, 1.0, 0.035);
        expect(requiredCapital).toBeCloseTo(2800, 0);
    });

    it('필요 자본금은 항상 양수', () => {
        const { requiredCapital } = calcRequiredCapital(50000, 0.5, 0.035);
        expect(requiredCapital).toBeGreaterThan(0);
    });
});

// ────────────────────────────────────────────────────────────────
// calcGoldenCross
// ────────────────────────────────────────────────────────────────
describe('calcGoldenCross', () => {
    const baseProfile = { cash: 5000, monthlySavings: 200, targetAmount: 50000 };
    const baseConfig = {
        investmentReturnRate: 8,
        apartmentAnnualRise: 3,
        ltvRatio: 0.5,
        acquisitionTaxRate: 0.035,
        savingsIncreaseRate: 0,
    };

    it('유효한 입력에서 결과 반환', () => {
        const result = calcGoldenCross(baseProfile, baseConfig);
        expect(result).not.toBeNull();
        expect(result.months).toBeGreaterThan(0);
    });

    it('months는 양의 정수', () => {
        const result = calcGoldenCross(baseProfile, baseConfig);
        expect(Number.isInteger(result.months)).toBe(true);
        expect(result.months).toBeGreaterThan(0);
    });

    it('crossDate는 현재보다 미래', () => {
        const result = calcGoldenCross(baseProfile, baseConfig);
        expect(result.crossDate.getTime()).toBeGreaterThan(Date.now() - 1000 * 60);
    });

    it('자산이 목표보다 이미 충분하면 months=0 가능', () => {
        const richProfile = { cash: 100000, monthlySavings: 0, targetAmount: 50000 };
        const result = calcGoldenCross(richProfile, baseConfig);
        expect(result).not.toBeNull();
        expect(result.months).toBe(0);
    });

    it('월 저축액이 0이고 자산 부족이면 null 반환(50년 초과)', () => {
        const poorProfile = { cash: 100, monthlySavings: 0, targetAmount: 90000 };
        const result = calcGoldenCross(poorProfile, baseConfig);
        expect(result).toBeNull();
    });

    it('저축 증가율이 높을수록 골든크로스가 더 빨리 옴', () => {
        const noGrowth = calcGoldenCross(baseProfile, { ...baseConfig, savingsIncreaseRate: 0 });
        const withGrowth = calcGoldenCross(baseProfile, { ...baseConfig, savingsIncreaseRate: 10 });
        expect(withGrowth.months).toBeLessThan(noGrowth.months);
    });

    it('투자 수익률이 높을수록 골든크로스가 더 빨리 옴', () => {
        const lowReturn = calcGoldenCross(baseProfile, { ...baseConfig, investmentReturnRate: 2 });
        const highReturn = calcGoldenCross(baseProfile, { ...baseConfig, investmentReturnRate: 15 });
        expect(highReturn.months).toBeLessThan(lowReturn.months);
    });

    it('아파트 상승률이 높을수록 골든크로스가 더 늦게 옴', () => {
        const lowRise = calcGoldenCross(baseProfile, { ...baseConfig, apartmentAnnualRise: 1 });
        const highRise = calcGoldenCross(baseProfile, { ...baseConfig, apartmentAnnualRise: 8 });
        expect(highRise.months).toBeGreaterThan(lowRise.months);
    });

    it('requiredCapital과 loanAmount, tax가 모두 포함됨', () => {
        const result = calcGoldenCross(baseProfile, baseConfig);
        expect(result).toHaveProperty('requiredCapital');
        expect(result).toHaveProperty('loanAmount');
        expect(result).toHaveProperty('tax');
        expect(result).toHaveProperty('finalAptPrice');
    });
});

// ────────────────────────────────────────────────────────────────
// calcInterestRateStress
// ────────────────────────────────────────────────────────────────
describe('calcInterestRateStress', () => {
    const profile = { cash: 5000, monthlySavings: 300, targetAmount: 50000 };
    const config = {
        investmentReturnRate: 8,
        apartmentAnnualRise: 3,
        ltvRatio: 0.5,
        acquisitionTaxRate: 0.035,
        savingsIncreaseRate: 0,
    };

    it('금리 상승 시 지연 개월은 0 이상', () => {
        const { delayMonths } = calcInterestRateStress(profile, config, 1, 25000);
        expect(delayMonths).toBeGreaterThanOrEqual(0);
    });

    it('대출금이 많을수록 지연이 더 큼', () => {
        const small = calcInterestRateStress(profile, config, 1, 10000);
        const large = calcInterestRateStress(profile, config, 1, 40000);
        expect(large.delayMonths).toBeGreaterThanOrEqual(small.delayMonths);
    });

    it('금리 상승폭이 클수록 지연이 더 큼', () => {
        const rise1 = calcInterestRateStress(profile, config, 1, 25000);
        const rise3 = calcInterestRateStress(profile, config, 3, 25000);
        expect(rise3.delayMonths).toBeGreaterThanOrEqual(rise1.delayMonths);
    });
});

// ────────────────────────────────────────────────────────────────
// calcPriceRiseStress
// ────────────────────────────────────────────────────────────────
describe('calcPriceRiseStress', () => {
    const profile = { cash: 5000, monthlySavings: 300, targetAmount: 50000 };
    const config = {
        investmentReturnRate: 8,
        apartmentAnnualRise: 3,
        ltvRatio: 0.5,
        acquisitionTaxRate: 0.035,
        savingsIncreaseRate: 0,
    };

    it('주택가격 10% 상승 시 지연은 0 이상', () => {
        const { delayMonths } = calcPriceRiseStress(profile, config, 10);
        expect(delayMonths).toBeGreaterThanOrEqual(0);
    });

    it('가격 상승폭이 클수록 지연이 더 큼', () => {
        const low = calcPriceRiseStress(profile, config, 5);
        const high = calcPriceRiseStress(profile, config, 20);
        expect(high.delayMonths).toBeGreaterThanOrEqual(low.delayMonths);
    });

    it('가격 상승 0%이면 지연 없음', () => {
        const { delayMonths } = calcPriceRiseStress(profile, config, 0);
        expect(delayMonths).toBe(0);
    });
});

// ────────────────────────────────────────────────────────────────
// buildChartData
// ────────────────────────────────────────────────────────────────
describe('buildChartData', () => {
    const profile = { cash: 5000, monthlySavings: 200, targetAmount: 60000 };
    const config = {
        investmentReturnRate: 8,
        apartmentAnnualRise: 3,
        ltvRatio: 0.5,
        acquisitionTaxRate: 0.035,
        savingsIncreaseRate: 0,
    };

    it('3개월 단위 데이터 포인트 생성', () => {
        const data = buildChartData(profile, config, 120);
        // 0, 3, 6, ..., 120 → 41개
        expect(data.length).toBe(41);
    });

    it('각 포인트에 month, year, asset, aptPrice, required 필드 존재', () => {
        const data = buildChartData(profile, config, 60);
        data.forEach((point) => {
            expect(point).toHaveProperty('month');
            expect(point).toHaveProperty('year');
            expect(point).toHaveProperty('asset');
            expect(point).toHaveProperty('aptPrice');
            expect(point).toHaveProperty('required');
        });
    });

    it('자산은 시간이 지날수록 증가해야 함', () => {
        const data = buildChartData(profile, config, 120);
        expect(data[data.length - 1].asset).toBeGreaterThan(data[0].asset);
    });

    it('아파트 가격도 시간이 지날수록 증가', () => {
        const data = buildChartData(profile, config, 120);
        expect(data[data.length - 1].aptPrice).toBeGreaterThan(data[0].aptPrice);
    });

    it('초기 자산은 cash와 같아야 함', () => {
        const data = buildChartData(profile, config, 120);
        expect(data[0].asset).toBe(profile.cash);
    });
});

// ────────────────────────────────────────────────────────────────
// formatKRW
// ────────────────────────────────────────────────────────────────
describe('formatKRW', () => {
    it('억 단위: 10000만원 → "1억원"', () => {
        expect(formatKRW(10000)).toBe('1억원');
    });

    it('만 단위만: 5000 → "5,000만원"', () => {
        expect(formatKRW(5000)).toBe('5,000만원');
    });

    it('혼합: 15000 → "1억 5,000만원"', () => {
        expect(formatKRW(15000)).toBe('1억 5,000만원');
    });

    it('0 또는 NaN → "0원"', () => {
        expect(formatKRW(0)).toBe('0원');
        expect(formatKRW(NaN)).toBe('0원');
        expect(formatKRW(undefined)).toBe('0원');
    });

    it('음수도 처리 가능', () => {
        // 양의 값이 아니므로 0억 0만 → "0원" 아닌 음수 처리
        const result = formatKRW(-5000);
        expect(typeof result).toBe('string');
    });

    it('소수점 반올림: 10000.6 → "1억원"', () => {
        const result = formatKRW(10000.6);
        expect(result).toContain('억');
    });
});

// ────────────────────────────────────────────────────────────────
// buildChartData — 기본값(defaulting) 분기
// ────────────────────────────────────────────────────────────────
describe('buildChartData — simConfig 기본값 분기', () => {
    const profile = { cash: 3000, monthlySavings: 150, targetAmount: 50000 };

    it('simConfig 필드 누락 시 기본값 사용', () => {
        // investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate 누락
        const data = buildChartData(profile, { savingsIncreaseRate: 0 }, 60);
        expect(data.length).toBeGreaterThan(0);
        data.forEach((p) => {
            expect(p.asset).toBeGreaterThanOrEqual(profile.cash);
        });
    });

    it('저축 증가율 > 0으로 12개월 이상 실행 시 분기 통과', () => {
        // t가 12 배수일 때 savingsGrowth 분기가 실행됨
        const data = buildChartData(profile, { savingsIncreaseRate: 5 }, 36);
        expect(data.length).toBe(13); // 0, 3, ..., 36
        // 저축 증가로 자산 성장 확인
        expect(data[data.length - 1].asset).toBeGreaterThan(data[0].asset);
    });

    it('savingsIncreaseRate 누락 시 0으로 처리', () => {
        const withZero = buildChartData(profile, { savingsIncreaseRate: 0 }, 24);
        const withUndef = buildChartData(profile, {}, 24);
        // 두 결과가 동일해야 함
        expect(withZero[withZero.length - 1].asset).toBeCloseTo(
            withUndef[withUndef.length - 1].asset,
            0
        );
    });
});

// ────────────────────────────────────────────────────────────────
// calcInterestRateStress — 극단값 분기
// ────────────────────────────────────────────────────────────────
describe('calcInterestRateStress — 극단값', () => {
    const config = {
        investmentReturnRate: 8,
        apartmentAnnualRise: 3,
        ltvRatio: 0.5,
        acquisitionTaxRate: 0.035,
        savingsIncreaseRate: 0,
    };

    it('이자 부담이 월 저축액보다 크면 저축 0으로 클램프', () => {
        // 월 저축 100만, 대출 12억, 금리 1% → 월 이자 100만원
        const profile = { cash: 5000, monthlySavings: 100, targetAmount: 50000 };
        const { delayMonths } = calcInterestRateStress(profile, config, 1, 120000);
        // 저축이 0이 되므로 매우 긴 지연 또는 999
        expect(delayMonths).toBeGreaterThan(0);
    });
});

// ────────────────────────────────────────────────────────────────
// formatYearMonth
// ────────────────────────────────────────────────────────────────
describe('formatYearMonth', () => {
    it('2026년 1월', () => {
        expect(formatYearMonth(new Date(2026, 0, 1))).toBe('2026년 1월');
    });

    it('2030년 12월', () => {
        expect(formatYearMonth(new Date(2030, 11, 1))).toBe('2030년 12월');
    });

    it('연·월 숫자가 포함된 문자열 반환', () => {
        const result = formatYearMonth(new Date(2026, 5, 15));
        expect(result).toMatch(/\d{4}년 \d{1,2}월/);
    });
});
