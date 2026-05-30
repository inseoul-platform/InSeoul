package com.inseoul.strategy.domain;

import lombok.Data;

@Data
public class Strategy {
    private String type;
    private String badge;
    private String title;
    private String subtitle;
    private String riskLevel;
    private String riskBadge;
    private String accentGradient;
    private int targetPrice;
}
