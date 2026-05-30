package com.inseoul.user.domain;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SimConfig {
    private Long userId;
    private BigDecimal savingsIncreaseRate;
    private BigDecimal investmentReturnRate;
    private BigDecimal apartmentAnnualRise;
    private BigDecimal ltvRatio;
    private BigDecimal acquisitionTaxRate;
    private LocalDateTime updatedAt;
}
