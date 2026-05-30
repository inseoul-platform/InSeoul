package com.inseoul.loan.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class EligibilityRequest {
    @NotNull @Min(18) private Integer age;
    @NotNull @Min(0)  private Integer income;
    @NotNull @Min(0)  private Integer targetAmount;
    @NotNull @Min(0)  private Integer cash;
}
