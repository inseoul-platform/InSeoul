package com.inseoul.loan.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoanProductDto {
    private String key;
    private String name;
    private String type;
    private String rateText;
    private int loanLimit;
    private String conditionText;
}
