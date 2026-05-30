package com.inseoul.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileDto {

    @Min(value = 0, message = "현금 보유액은 0 이상이어야 합니다.")
    @Max(value = 100_000, message = "현금 보유액은 100,000만원 이하여야 합니다.")
    private int cash;

    @Min(value = 0, message = "월 저축액은 0 이상이어야 합니다.")
    @Max(value = 5_000, message = "월 저축액은 5,000만원 이하여야 합니다.")
    private int monthlySavings;

    @Min(value = 0, message = "목표 자산은 0 이상이어야 합니다.")
    @Max(value = 500_000, message = "목표 자산은 500,000만원 이하여야 합니다.")
    private int targetAmount;

    @Min(value = 18, message = "나이는 18세 이상이어야 합니다.")
    @Max(value = 80, message = "나이는 80세 이하여야 합니다.")
    private int age;

    @Min(value = 0, message = "월 소득은 0 이상이어야 합니다.")
    @Max(value = 5_000, message = "월 소득은 5,000만원 이하여야 합니다.")
    private int income;
}
