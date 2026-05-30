package com.inseoul.simulation.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StressTestResponse {
    private int baseMonths;
    private int interestRise1pctDelay;
    private int interestRise2pctDelay;
    private int priceRise10pctDelay;
    private int priceRise20pctDelay;
}
