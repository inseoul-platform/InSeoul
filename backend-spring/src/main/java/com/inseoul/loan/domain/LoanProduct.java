package com.inseoul.loan.domain;

import lombok.Data;

@Data
public class LoanProduct {
    private String prodKey;
    private String name;
    private String type;
    private String rateText;
    private int loanLimit;
    private String conditionText;
}
