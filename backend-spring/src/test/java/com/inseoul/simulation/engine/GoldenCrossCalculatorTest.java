package com.inseoul.simulation.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GoldenCrossCalculatorTest {

    private GoldenCrossCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new GoldenCrossCalculator();
    }

    @Test
    void calcGoldenCross_현실적입력_정상크로스반환() {
        GoldenCrossCalculator.GoldenCrossResult result = calculator.calcGoldenCross(
                50000, 300, 120000, 8.0, 3.0, 0.5, 0.035, 5.0
        );

        assertThat(result).isNotNull();
        assertThat(result.months()).isGreaterThan(0);
        assertThat(result.months()).isLessThan(600);
        assertThat(result.finalAptPrice()).isGreaterThan(120000);
        assertThat(result.crossDate()).isNotNull();
    }

    @Test
    void calcGoldenCross_자산이미충분_월0반환() {
        // cash 200000 > 100000 * (1 - 0.5) + 100000 * 0.035 = 53500
        GoldenCrossCalculator.GoldenCrossResult result = calculator.calcGoldenCross(
                200000, 300, 100000, 8.0, 3.0, 0.5, 0.035, 5.0
        );

        assertThat(result).isNotNull();
        assertThat(result.months()).isEqualTo(0);
    }

    @Test
    void calcGoldenCross_불가능입력_null반환() {
        // 저축 0, 수익률 0, 자산 1만원, 목표 10억 → 600개월 내 불가
        GoldenCrossCalculator.GoldenCrossResult result = calculator.calcGoldenCross(
                1, 0, 100000, 0.0, 5.0, 0.5, 0.035, 0.0
        );

        assertThat(result).isNull();
    }

    @Test
    void calcInterestRateStress_금리상승_지연개월반환() {
        GoldenCrossCalculator.StressResult result = calculator.calcInterestRateStress(
                50000, 300, 120000, 8.0, 3.0, 0.5, 0.035, 5.0,
                1.0, 60000
        );

        assertThat(result).isNotNull();
        assertThat(result.delayMonths()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void buildChartData_12개월_5포인트반환() {
        List<GoldenCrossCalculator.ChartPoint> points = calculator.buildChartData(
                50000, 300, 120000, 8.0, 3.0, 0.5, 0.035, 5.0, 12
        );

        // t=0,3,6,9,12 → 5 points
        assertThat(points).hasSize(5);
        assertThat(points.get(0).month()).isEqualTo(0);
        assertThat(points.get(1).month()).isEqualTo(3);
        assertThat(points.get(4).month()).isEqualTo(12);
    }
}
