package com.inseoul.simulation.engine;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * calculator.js를 Java로 포팅한 시뮬레이션 엔진.
 * 단위: 만 원 (입출력 모두)
 */
@Component
public class GoldenCrossCalculator {

    private static final int MAX_MONTHS = 600;

    public record GoldenCrossResult(
            int months,
            LocalDate crossDate,
            double requiredCapital,
            double loanAmount,
            double tax,
            double finalAptPrice
    ) {}

    public record ChartPoint(
            int month,
            String year,
            long asset,
            double aptPrice,
            double required
    ) {}

    public record StressResult(int delayMonths) {}

    /**
     * 골든크로스 시점 예측 — 자산이 필요자본금을 처음 초과하는 월
     */
    public GoldenCrossResult calcGoldenCross(
            double cash,
            double monthlySavings,
            double targetAmount,
            double investmentReturnRate,
            double apartmentAnnualRise,
            double ltvRatio,
            double acquisitionTaxRate,
            double savingsIncreaseRate
    ) {
        double monthlyReturn = (investmentReturnRate / 100.0) / 12.0;
        double riseRate = apartmentAnnualRise / 100.0;
        double savingsGrowth = savingsIncreaseRate / 100.0;

        double currentAsset = cash;
        double currentMonthlySavings = monthlySavings;
        Integer crossMonths = null;

        for (int t = 0; t <= MAX_MONTHS; t++) {
            if (t > 0 && t % 12 == 0) {
                currentMonthlySavings *= (1 + savingsGrowth);
            }
            if (t > 0) {
                currentAsset = currentAsset * (1 + monthlyReturn) + currentMonthlySavings;
            }

            double aptPrice = calcApartmentPrice(targetAmount, riseRate, t);
            double required = calcRequiredCapital(aptPrice, ltvRatio, acquisitionTaxRate);

            if (currentAsset >= required) {
                crossMonths = t;
                break;
            }
        }

        if (crossMonths == null) return null;

        LocalDate crossDate = LocalDate.now().plusMonths(crossMonths);
        double finalAptPrice = calcApartmentPrice(targetAmount, riseRate, crossMonths);
        double loan = finalAptPrice * ltvRatio;
        double tax = finalAptPrice * acquisitionTaxRate;
        double required = calcRequiredCapital(finalAptPrice, ltvRatio, acquisitionTaxRate);

        return new GoldenCrossResult(crossMonths, crossDate, required, loan, tax, finalAptPrice);
    }

    /**
     * 차트용 시계열 데이터 (3개월 단위 포인트)
     */
    public List<ChartPoint> buildChartData(
            double cash,
            double monthlySavings,
            double targetAmount,
            double investmentReturnRate,
            double apartmentAnnualRise,
            double ltvRatio,
            double acquisitionTaxRate,
            double savingsIncreaseRate,
            int totalMonths
    ) {
        double monthlyReturn = (investmentReturnRate / 100.0) / 12.0;
        double riseRate = apartmentAnnualRise / 100.0;
        double savingsGrowth = savingsIncreaseRate / 100.0;

        List<ChartPoint> data = new ArrayList<>();
        double currentAsset = cash;
        double currentMonthlySavings = monthlySavings;
        LocalDate now = LocalDate.now();

        for (int t = 0; t <= totalMonths; t++) {
            if (t > 0 && t % 12 == 0) {
                currentMonthlySavings *= (1 + savingsGrowth);
            }
            if (t > 0) {
                currentAsset = currentAsset * (1 + monthlyReturn) + currentMonthlySavings;
            }

            if (t % 3 == 0) {
                double aptPrice = calcApartmentPrice(targetAmount, riseRate, t);
                double required = calcRequiredCapital(aptPrice, ltvRatio, acquisitionTaxRate);
                LocalDate d = now.plusMonths(t);
                String year = (d.getYear() % 100) + "년";
                data.add(new ChartPoint(t, year, Math.round(currentAsset), aptPrice, required));
            }
        }
        return data;
    }

    /** 금리 상승 스트레스 테스트 */
    public StressResult calcInterestRateStress(
            double cash, double monthlySavings, double targetAmount,
            double investmentReturnRate, double apartmentAnnualRise,
            double ltvRatio, double acquisitionTaxRate, double savingsIncreaseRate,
            double interestRateIncrease, double loanAmount
    ) {
        GoldenCrossResult base = calcGoldenCross(cash, monthlySavings, targetAmount,
                investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate, savingsIncreaseRate);
        if (base == null) return new StressResult(999);

        double monthlyInterestIncrease = loanAmount * (interestRateIncrease / 100.0) / 12.0;
        double stressedSavings = Math.max(0, monthlySavings - monthlyInterestIncrease);
        GoldenCrossResult stress = calcGoldenCross(cash, stressedSavings, targetAmount,
                investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate, savingsIncreaseRate);
        if (stress == null) return new StressResult(999);

        return new StressResult(stress.months() - base.months());
    }

    /** 주택 가격 상승 스트레스 테스트 */
    public StressResult calcPriceRiseStress(
            double cash, double monthlySavings, double targetAmount,
            double investmentReturnRate, double apartmentAnnualRise,
            double ltvRatio, double acquisitionTaxRate, double savingsIncreaseRate,
            double priceRise
    ) {
        GoldenCrossResult base = calcGoldenCross(cash, monthlySavings, targetAmount,
                investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate, savingsIncreaseRate);
        if (base == null) return new StressResult(999);

        double stressedTarget = targetAmount * (1 + priceRise / 100.0);
        GoldenCrossResult stress = calcGoldenCross(cash, monthlySavings, stressedTarget,
                investmentReturnRate, apartmentAnnualRise, ltvRatio, acquisitionTaxRate, savingsIncreaseRate);
        if (stress == null) return new StressResult(999);

        return new StressResult(stress.months() - base.months());
    }

    private double calcApartmentPrice(double currentPrice, double annualRise, int months) {
        return currentPrice * Math.pow(1 + annualRise, months / 12.0);
    }

    private double calcRequiredCapital(double aptPrice, double ltvRatio, double acquisitionTaxRate) {
        return aptPrice * (1 - ltvRatio) + aptPrice * acquisitionTaxRate;
    }
}
