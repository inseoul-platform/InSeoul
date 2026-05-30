package com.inseoul.strategy.domain;

import lombok.Data;

@Data
public class StrategyStep {
    private int id;
    private String strategyType;
    private int stepOrder;
    private String title;
    private String description;
    private String icon;
    private int phasePct;
}
