# InSeoul 계산 로직 — calculator.js 수식 문서화

## 개요

InSeoul의 모든 수치 계산은 `src/utils/calculator.js`에 정의되어 있다.
단위는 **만 원** (입력/출력 모두).
시뮬레이션 설정(simConfig)과 사용자 프로필(userProfile)을 기반으로 계산한다.

## 사용자 프로필 (userProfile)

| 필드 | 설명 | 단위 |
|------|------|------|
| cash | 현재 보유 현금 | 만원 |
| monthlySavings | 월 저축 가능액 | 만원 |
| targetAmount | 목표 아파트 가격 | 만원 |
| age | 나이 | 세 |
| income | 월 소득 | 만원 |

## 시뮬레이션 설정 (simConfig)

| 필드 | 기본값 | 설명 |
|------|--------|------|
| investmentReturnRate | 8 | 연 투자 수익률 (%) |
| apartmentAnnualRise | 3 | 아파트 연간 상승률 (%) |
| ltvRatio | 0.5 | LTV 비율 (50%) |
| acquisitionTaxRate | 0.035 | 취득세율 (3.5%) |
| savingsIncreaseRate | 5 | 연 저축액 증가율 (%) |

## 자산 성장 모델 — calcAssetGrowth

복리 자산 성장 공식:

```
월 수익률 = 연 투자 수익률 / 12
현금 미래가치 = cash × (1 + 월수익률)^months
적금 미래가치 = monthlySavings × ((1 + 월수익률)^months - 1) / 월수익률
총 자산 A(t) = 현금 미래가치 + 적금 미래가치
```

- 월 수익률이 0이면 단순 합산: A(t) = cash + monthlySavings × months
- 연 8% 수익률 기준 월 수익률 ≈ 0.667%

## 아파트 가격 예측 모델 — calcApartmentPrice

```
P(t) = 현재가격 × (1 + 연간상승률)^(t/12)
```

- t는 개월 수
- 연 3% 상승 기준: 10년 후 약 134%로 상승
- 예시: 5억 원 아파트, 연 3% 상승, 5년 후 → 5억 × 1.03^5 ≈ 5억 7,964만원

## LTV 대출 가능액 — calcLoanAmount

```
대출 가능액 = targetPrice × ltvRatio
```

- 기본 LTV 50%: 5억 원 → 대출 2억 5천만원

## 취득세 계산 — calcAcquisitionTax

```
취득세 = targetPrice × acquisitionTaxRate
```

- 기본 세율 3.5%: 5억 원 → 취득세 1,750만원

## 필요 자본금 계산 — calcRequiredCapital

```
필요 자본금 = targetPrice × (1 - ltvRatio) + 취득세
대출 가능액 = targetPrice × ltvRatio
```

- 반환값: { requiredCapital, loanAmount, tax }
- 예시: 5억, LTV 50%, 취득세 3.5% → 필요자본금 2억 6,750만원

## 골든크로스 예측 — calcGoldenCross

매월 반복 계산으로 자산과 필요자본금의 교차 시점 탐색:

```
초기: currentAsset = cash, currentMonthlySavings = monthlySavings
매월 t:
  - t가 12의 배수면: currentMonthlySavings *= (1 + savingsGrowth)  [연 저축 증가]
  - currentAsset = currentAsset × (1 + monthlyReturn) + currentMonthlySavings
  - aptPrice = calcApartmentPrice(targetAmount, riseRate, t)
  - { requiredCapital } = calcRequiredCapital(aptPrice, ltvRatio, acquisitionTaxRate)
  - currentAsset >= requiredCapital 이면 crossMonths = t, 종료
```

- 최대 탐색 범위: 600개월(50년)
- 반환값: { months, crossDate, requiredCapital, loanAmount, tax, finalAptPrice }
- 50년 내 불가능하면 null 반환

## 리스크 스트레스 테스트

### 금리 상승 스트레스 — calcInterestRateStress

금리가 n% 오르면 월 이자 부담 증가 → 실질 저축액 감소 → 골든크로스 지연:

```
월 이자 증가액 = loanAmount × (interestRateIncrease / 100) / 12
스트레스 저축액 = max(0, monthlySavings - 월 이자 증가액)
지연 = 스트레스 골든크로스 개월 - 기준 골든크로스 개월
```

### 주택 가격 급등 스트레스 — calcPriceRiseStress

목표 가격이 n% 오르면 필요자본금 증가 → 골든크로스 지연:

```
스트레스 목표가 = targetAmount × (1 + priceRise / 100)
지연 = 스트레스 골든크로스 개월 - 기준 골든크로스 개월
```

## 차트 데이터 생성 — buildChartData

3개월 간격으로 자산/아파트가격/필요자본금 시계열 생성:

```
매 t개월 (t % 3 == 0):
  - asset: 현재 누적 자산
  - aptPrice: 해당 시점 아파트 예상 가격
  - required: 해당 시점 필요 자본금
```

## 골든크로스를 앞당기는 방법

1. **투자 수익률 상향**: investmentReturnRate 증가 → 자산 성장 가속
2. **저축액 증가**: monthlySavings 증가 → 매달 자산 축적 가속
3. **LTV 상향**: ltvRatio 증가 → 필요자본금 감소 (단, 대출 이자 부담 증가)
4. **목표 아파트 하향**: targetAmount 감소 → 필요자본금 절대값 감소
5. **저축 증가율 상향**: savingsIncreaseRate → 매년 저축액 복리 증가
