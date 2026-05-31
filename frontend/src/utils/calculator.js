/**
 * calculator.js — InSeoul 핵심 계산 로직
 *
 * 단위: 만 원 (입력/출력 모두)
 */

/**
 * 복리 자산 성장 모델
 * A(t) = (현금 + 월저축 × t) × (1 + 투자수익률)^t
 * @param {number} cash          현재 보유 현금 (만 원)
 * @param {number} monthlySavings 월 저축액 (만 원)
 * @param {number} returnRate    연 투자 수익률 (0~1, e.g. 0.08)
 * @param {number} months        경과 개월 수
 * @returns {number} 예상 자산 (만 원)
 */
export function calcAssetGrowth(cash, monthlySavings, returnRate, months) {
    const monthlyRate = returnRate / 12;
    if (monthlyRate === 0) {
        return cash + monthlySavings * months;
    }
    // 미래가치: 현금 복리 + 적금 복리 적립
    const cashFV = cash * Math.pow(1 + monthlyRate, months);
    const savingsFV =
        monthlySavings *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return cashFV + savingsFV;
}

/**
 * 아파트 가격 예측 모델
 * P(t) = 현재가격 × (1 + 연간상승률)^(t/12)
 * @param {number} currentPrice  현재 아파트 가격 (만 원)
 * @param {number} annualRise    연 상승률 (0~1, e.g. 0.03)
 * @param {number} months        경과 개월 수
 * @returns {number} 예상 아파트 가격 (만 원)
 */
export function calcApartmentPrice(currentPrice, annualRise, months) {
    return currentPrice * Math.pow(1 + annualRise, months / 12);
}

/**
 * LTV 기준 대출 가능액 계산
 * @param {number} targetPrice  목표 아파트 가격 (만 원)
 * @param {number} ltvRatio     LTV 비율 (e.g. 0.5)
 * @returns {number} 대출 가능액 (만 원)
 */
export function calcLoanAmount(targetPrice, ltvRatio = 0.5) {
    return targetPrice * ltvRatio;
}

/**
 * 취득세 계산
 * @param {number} targetPrice         목표 아파트 가격 (만 원)
 * @param {number} acquisitionTaxRate  취득세율 (e.g. 0.035)
 * @returns {number} 취득세 (만 원)
 */
export function calcAcquisitionTax(targetPrice, acquisitionTaxRate = 0.035) {
    return targetPrice * acquisitionTaxRate;
}

/**
 * 필요 자본금 계산 (LTV 자기자본 + 취득세)
 * @param {number} targetPrice
 * @param {number} ltvRatio
 * @param {number} acquisitionTaxRate
 * @returns {{ requiredCapital: number, loanAmount: number, tax: number }}
 */
export function calcRequiredCapital(
    targetPrice,
    ltvRatio = 0.5,
    acquisitionTaxRate = 0.035
) {
    const loanAmount = calcLoanAmount(targetPrice, ltvRatio);
    const tax = calcAcquisitionTax(targetPrice, acquisitionTaxRate);
    const requiredCapital = targetPrice * (1 - ltvRatio) + tax;
    return { requiredCapital, loanAmount, tax };
}

/**
 * 골든크로스 시점 예측
 * A(t) >= requiredCapital 을 만족하는 최소 t (개월)
 *
 * @param {object} userProfile  { cash, monthlySavings, targetAmount }
 * @param {object} simConfig    { investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate }
 * @returns {{ months: number, crossDate: Date, requiredCapital: number, loanAmount: number, tax: number } | null}
 */
export function calcGoldenCross(userProfile, simConfig) {
    const {
        cash,
        monthlySavings,
        targetAmount,
    } = userProfile;

    const {
        investmentReturnRate,
        apartmentAnnualRise = 0.03,
        ltvRatio = 0.5,
        acquisitionTaxRate = 0.035,
    } = simConfig;

    const returnRate = investmentReturnRate / 100;
    const monthlyReturn = returnRate / 12;
    const riseRate = apartmentAnnualRise / 100;
    const savingsGrowth = (simConfig.savingsIncreaseRate || 0) / 100;

    const MAX_MONTHS = 600; // 50년 상한
    let crossMonths = null;

    let currentAsset = cash;
    let currentMonthlySavings = monthlySavings;

    for (let t = 0; t <= MAX_MONTHS; t++) {
        // 매년 저축액 증가 반영 (t > 0 이고 t가 12의 배수일 때)
        if (t > 0 && t % 12 === 0) {
            currentMonthlySavings *= (1 + savingsGrowth);
        }

        // 이번 달 저축 및 수익 반영 (t=0일 때는 초기값이므로 건너뜀)
        if (t > 0) {
            currentAsset = currentAsset * (1 + monthlyReturn) + currentMonthlySavings;
        }

        const aptPrice = calcApartmentPrice(targetAmount, riseRate, t);
        const { requiredCapital } = calcRequiredCapital(aptPrice, ltvRatio, acquisitionTaxRate);

        if (currentAsset >= requiredCapital) {
            crossMonths = t;
            break;
        }
    }

    if (crossMonths === null) return null;

    const crossDate = new Date();
    crossDate.setMonth(crossDate.getMonth() + crossMonths);

    const finalAptPrice = calcApartmentPrice(targetAmount, riseRate, crossMonths);
    const { requiredCapital, loanAmount, tax } = calcRequiredCapital(
        finalAptPrice,
        ltvRatio,
        acquisitionTaxRate
    );

    return {
        months: crossMonths,
        crossDate,
        requiredCapital,
        loanAmount,
        tax,
        finalAptPrice,
    };
}

/**
 * 리스크 스트레스 테스트 — 금리 n% 상승 시 지연 개월 계산
 * @param {object} userProfile
 * @param {object} simConfig
 * @param {number} interestRateIncrease  금리 상승폭 (%, e.g. 1)
 * @param {number} loanAmount           기존 대출금 (만 원)
 * @returns {{ delayMonths: number }}
 */
export function calcInterestRateStress(
    userProfile,
    simConfig,
    interestRateIncrease,
    loanAmount
) {
    const baseResult = calcGoldenCross(userProfile, simConfig);
    if (!baseResult) return { delayMonths: 999 };

    // 금리 상승 → 월 이자 부담 증가 → 실질 월 저축액 감소
    const monthlyInterestIncrease = (loanAmount * (interestRateIncrease / 100)) / 12;
    const stressedProfile = {
        ...userProfile,
        monthlySavings: Math.max(0, userProfile.monthlySavings - monthlyInterestIncrease),
    };

    const stressResult = calcGoldenCross(stressedProfile, simConfig);
    if (!stressResult) return { delayMonths: 999 };

    return { delayMonths: stressResult.months - baseResult.months };
}

/**
 * 리스크 스트레스 테스트 — 주택 가격 n% 상승 시 지연 개월 계산
 * @param {object} userProfile
 * @param {object} simConfig
 * @param {number} priceRise  가격 상승폭 (%, e.g. 10)
 * @returns {{ delayMonths: number }}
 */
export function calcPriceRiseStress(userProfile, simConfig, priceRise) {
    const baseResult = calcGoldenCross(userProfile, simConfig);
    if (!baseResult) return { delayMonths: 999 };

    const stressedProfile = {
        ...userProfile,
        targetAmount: userProfile.targetAmount * (1 + priceRise / 100),
    };

    const stressResult = calcGoldenCross(stressedProfile, simConfig);
    if (!stressResult) return { delayMonths: 999 };

    return { delayMonths: stressResult.months - baseResult.months };
}

/**
 * 차트용 시계열 데이터 생성
 * @param {object} userProfile
 * @param {object} simConfig
 * @param {number} totalMonths  표시할 총 개월 수
 * @returns {Array<{ month: number, year: string, asset: number, aptPrice: number, required: number }>}
 */
export function buildChartData(userProfile, simConfig, totalMonths = 120) {
    const { cash, monthlySavings, targetAmount } = userProfile;
    const returnRate = (simConfig.investmentReturnRate ?? 8) / 100;
    const riseRate = (simConfig.apartmentAnnualRise ?? 3) / 100;
    const ltvRatio = simConfig.ltvRatio ?? 0.5;
    const acquisitionTaxRate = simConfig.acquisitionTaxRate ?? 0.035;

    const savingsGrowth = (simConfig.savingsIncreaseRate || 0) / 100;

    const now = new Date();
    const data = [];

    let currentAsset = cash;
    let currentMonthlySavings = monthlySavings;
    const monthlyReturn = returnRate / 12;

    for (let t = 0; t <= totalMonths; t++) {
        if (t > 0 && t % 12 === 0) {
            currentMonthlySavings *= (1 + savingsGrowth);
        }
        if (t > 0) {
            currentAsset = currentAsset * (1 + monthlyReturn) + currentMonthlySavings;
        }

        // 3개월 단위로 데이터 포인트 추가
        if (t % 3 === 0) {
            const aptPrice = calcApartmentPrice(targetAmount, riseRate, t);
            const { requiredCapital } = calcRequiredCapital(aptPrice, ltvRatio, acquisitionTaxRate);

            const d = new Date(now);
            d.setMonth(d.getMonth() + t);
            const year = `${d.getFullYear() % 100}년`;

            data.push({ month: t, year, asset: Math.round(currentAsset), aptPrice, required: requiredCapital });
        }
    }

    return data;
}

/**
 * 만 원 → 한국식 금액 포맷
 * @param {number} manWon  만 원 단위 숫자
 * @returns {string}  예: "4억 5,000만원"
 */
export function formatKRW(manWon) {
    if (!manWon || isNaN(manWon)) return '0원';
    const eok = Math.floor(manWon / 10000);
    const man = Math.round(manWon % 10000);
    if (eok === 0) return `${man.toLocaleString()}만원`;
    if (man === 0) return `${eok}억원`;
    return `${eok}억 ${man.toLocaleString()}만원`;
}

/**
 * 날짜 → 'YYYY년 M월' 포맷
 * @param {Date} date
 * @returns {string}
 */
export function formatYearMonth(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
