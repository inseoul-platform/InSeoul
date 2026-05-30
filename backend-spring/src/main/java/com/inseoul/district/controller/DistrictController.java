package com.inseoul.district.controller;

import com.inseoul.common.dto.ApiResponse;
import com.inseoul.common.exception.BaseException;
import com.inseoul.common.exception.ErrorCode;
import com.inseoul.district.dto.DistrictDetailPriceDto;
import com.inseoul.district.dto.DistrictDto;
import com.inseoul.district.dto.DistrictPriceDto;
import com.inseoul.district.service.DistrictService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "District", description = "서울시 25개 자치구 API")
@RestController
@RequestMapping("/api/districts")
@RequiredArgsConstructor
public class DistrictController {

    private final DistrictService districtService;

    @Operation(summary = "전체 구 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<DistrictDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(districtService.getAllDistricts()));
    }

    @Operation(summary = "전체 구 매매/전세 평균가 조회 (캐시 24h TTL)")
    @GetMapping("/prices")
    public ResponseEntity<ApiResponse<List<DistrictPriceDto>>> getPrices(
            @RequestParam(defaultValue = "false") boolean refresh) {
        return ResponseEntity.ok(ApiResponse.ok(districtService.getAllPrices(refresh)));
    }

    @Operation(summary = "특정 구 매매/전세 평균가 조회")
    @GetMapping("/{code}/prices")
    public ResponseEntity<ApiResponse<DistrictDetailPriceDto>> getDistrictPrice(@PathVariable String code) {
        DistrictDetailPriceDto result = districtService.getDistrictPrice(code);
        if (result == null) throw new BaseException(ErrorCode.NOT_FOUND);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
