package com.inseoul.simulation.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ChartDataResponse {
    private List<Point> points;

    @Getter
    @Builder
    public static class Point {
        private int month;
        private String year;
        private long asset;
        private double aptPrice;
        private double required;
    }
}
