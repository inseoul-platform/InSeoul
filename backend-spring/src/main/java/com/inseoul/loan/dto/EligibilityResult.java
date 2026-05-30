package com.inseoul.loan.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EligibilityResult {
    private String productKey;
    private String productName;
    private boolean eligible;
    private String reason;
    private int maxLoan;
}
