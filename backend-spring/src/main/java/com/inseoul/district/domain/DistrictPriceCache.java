package com.inseoul.district.domain;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DistrictPriceCache {
    private String code;
    private BigDecimal tradeAvg;
    private BigDecimal rentAvg;
    private LocalDateTime fetchedAt;
}
