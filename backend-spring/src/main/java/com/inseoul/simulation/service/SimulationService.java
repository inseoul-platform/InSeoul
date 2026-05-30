package com.inseoul.simulation.service;

import com.inseoul.simulation.dto.*;
import com.inseoul.simulation.engine.GoldenCrossCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimulationService {

    private final GoldenCrossCalculator calculator;

    public GoldenCrossResponse goldenCross(SimulationRequest req) {
        GoldenCrossCalculator.GoldenCrossResult result = calculator.calcGoldenCross(
                req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate()
        );

        if (result == null) {
            return GoldenCrossResponse.builder().build();
        }

        return GoldenCrossResponse.builder()
                .months(result.months())
                .crossDate(result.crossDate())
                .requiredCapital(result.requiredCapital())
                .loanAmount(result.loanAmount())
                .tax(result.tax())
                .finalAptPrice(result.finalAptPrice())
                .build();
    }

    public StressTestResponse stressTest(SimulationRequest req) {
        GoldenCrossCalculator.GoldenCrossResult base = calculator.calcGoldenCross(
                req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate()
        );

        int baseMonths = base != null ? base.months() : 999;
        double loanAmt = base != null ? base.loanAmount() : req.getTargetAmount() * req.getLtvRatio();

        return StressTestResponse.builder()
                .baseMonths(baseMonths)
                .interestRise1pctDelay(calculator.calcInterestRateStress(
                        req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                        req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                        req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate(),
                        1.0, loanAmt).delayMonths())
                .interestRise2pctDelay(calculator.calcInterestRateStress(
                        req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                        req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                        req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate(),
                        2.0, loanAmt).delayMonths())
                .priceRise10pctDelay(calculator.calcPriceRiseStress(
                        req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                        req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                        req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate(),
                        10.0).delayMonths())
                .priceRise20pctDelay(calculator.calcPriceRiseStress(
                        req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                        req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                        req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate(),
                        20.0).delayMonths())
                .build();
    }

    public ChartDataResponse chartData(SimulationRequest req) {
        int horizon = req.getHorizonMonths() != null ? req.getHorizonMonths() : 120;
        List<GoldenCrossCalculator.ChartPoint> points = calculator.buildChartData(
                req.getCash(), req.getMonthlySavings(), req.getTargetAmount(),
                req.getInvestmentReturnRate(), req.getApartmentAnnualRise(),
                req.getLtvRatio(), req.getAcquisitionTaxRate(), req.getSavingsIncreaseRate(),
                horizon
        );

        return ChartDataResponse.builder()
                .points(points.stream()
                        .map(p -> ChartDataResponse.Point.builder()
                                .month(p.month())
                                .year(p.year())
                                .asset(p.asset())
                                .aptPrice(p.aptPrice())
                                .required(p.required())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
