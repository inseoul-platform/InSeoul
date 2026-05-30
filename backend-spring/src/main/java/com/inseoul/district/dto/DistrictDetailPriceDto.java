package com.inseoul.district.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class DistrictDetailPriceDto {
    private String code;
    private String region;
    private BigDecimal tradeAvg;
    private BigDecimal rentAvg;
    private List<MonthlyPrice> byMonth;

    @Getter
    @Builder
    public static class MonthlyPrice {
        private String yearMonth;
        private BigDecimal tradeAvg;
        private BigDecimal rentAvg;
    }
}
