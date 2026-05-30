package com.inseoul.strategy.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class StrategyDetailDto {
    private String type;
    private String badge;
    private String title;
    private String subtitle;
    private String riskLevel;
    private String riskBadge;
    private String accentGradient;
    private int targetPrice;
    private List<StepDto> steps;

    @Getter
    @Builder
    public static class StepDto {
        private int order;
        private String title;
        private String description;
        private String icon;
        private int phasePct;
    }
}
