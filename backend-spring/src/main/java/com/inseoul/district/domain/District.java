package com.inseoul.district.domain;

import lombok.Data;

@Data
public class District {
    private String code;
    private String region;
    private double lat;
    private double lng;
    private String tierDefault;
}
