package com.inseoul.simulation.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;

@Getter
public class SimulationRequest {
    @NotNull @Min(0) private Double cash;
    @NotNull @Min(0) private Double monthlySavings;
    @NotNull @Min(0) private Double targetAmount;

    @NotNull @DecimalMin("-10.0") @DecimalMax("30.0") private Double investmentReturnRate;
    @NotNull @DecimalMin("0.0")   @DecimalMax("10.0") private Double apartmentAnnualRise;
    @NotNull @DecimalMin("0.0")   @DecimalMax("1.0")  private Double ltvRatio;
    @NotNull @DecimalMin("0.0")   @DecimalMax("0.1")  private Double acquisitionTaxRate;
    @NotNull @DecimalMin("0.0")   @DecimalMax("30.0") private Double savingsIncreaseRate;

    private Integer horizonMonths;
}
