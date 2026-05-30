package com.inseoul.simulation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class GoldenCrossResponse {
    private Integer months;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate crossDate;
    private Double requiredCapital;
    private Double loanAmount;
    private Double tax;
    private Double finalAptPrice;
}
