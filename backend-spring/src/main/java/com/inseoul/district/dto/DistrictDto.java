package com.inseoul.district.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DistrictDto {
    private String code;
    private String region;
    private double lat;
    private double lng;
    private String tierDefault;
}
