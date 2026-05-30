package com.inseoul.strategy.controller;

import com.inseoul.common.dto.ApiResponse;
import com.inseoul.strategy.dto.StrategyDetailDto;
import com.inseoul.strategy.dto.StrategyDto;
import com.inseoul.strategy.service.StrategyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Strategy", description = "투자 전략 API")
@RestController
@RequestMapping("/api/strategies")
@RequiredArgsConstructor
public class StrategyController {

    private final StrategyService strategyService;

    @Operation(summary = "전략 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<StrategyDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(strategyService.getAll()));
    }

    @Operation(summary = "전략 상세 + 단계 조회")
    @GetMapping("/{type}")
    public ResponseEntity<ApiResponse<StrategyDetailDto>> getDetail(@PathVariable String type) {
        return ResponseEntity.ok(ApiResponse.ok(strategyService.getDetail(type)));
    }
}
