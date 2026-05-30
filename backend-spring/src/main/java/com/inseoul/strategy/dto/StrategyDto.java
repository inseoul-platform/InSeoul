package com.inseoul.strategy.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StrategyDto {
    private String type;
    private String badge;
    private String title;
    private String subtitle;
    private String riskLevel;
    private String riskBadge;
    private String accentGradient;
    private int targetPrice;
}
