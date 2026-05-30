package com.inseoul.user.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class SimConfigDto {

    @NotNull
    @DecimalMin(value = "0.0", message = "저축 증가율은 0% 이상이어야 합니다.")
    @DecimalMax(value = "30.0", message = "저축 증가율은 30% 이하여야 합니다.")
    private BigDecimal savingsIncreaseRate;

    @NotNull
    @DecimalMin(value = "-10.0", message = "투자 수익률은 -10% 이상이어야 합니다.")
    @DecimalMax(value = "30.0", message = "투자 수익률은 30% 이하여야 합니다.")
    private BigDecimal investmentReturnRate;

    @NotNull
    @DecimalMin(value = "0.0", message = "아파트 상승률은 0% 이상이어야 합니다.")
    @DecimalMax(value = "10.0", message = "아파트 상승률은 10% 이하여야 합니다.")
    private BigDecimal apartmentAnnualRise;

    @NotNull
    @DecimalMin(value = "0.0", message = "LTV 비율은 0.0 이상이어야 합니다.")
    @DecimalMax(value = "1.0", message = "LTV 비율은 1.0 이하여야 합니다.")
    private BigDecimal ltvRatio;

    @NotNull
    @DecimalMin(value = "0.0", message = "취득세율은 0.0 이상이어야 합니다.")
    @DecimalMax(value = "0.1", message = "취득세율은 0.1 이하여야 합니다.")
    private BigDecimal acquisitionTaxRate;
}
