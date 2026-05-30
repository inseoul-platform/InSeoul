package com.inseoul.simulation.controller;

import com.inseoul.common.dto.ApiResponse;
import com.inseoul.simulation.dto.*;
import com.inseoul.simulation.service.SimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Simulation", description = "시뮬레이션 계산 API")
@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    @Operation(summary = "골든크로스 시점 예측")
    @PostMapping("/golden-cross")
    public ResponseEntity<ApiResponse<GoldenCrossResponse>> goldenCross(
            @Valid @RequestBody SimulationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(simulationService.goldenCross(req)));
    }

    @Operation(summary = "리스크 스트레스 테스트")
    @PostMapping("/stress-test")
    public ResponseEntity<ApiResponse<StressTestResponse>> stressTest(
            @Valid @RequestBody SimulationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(simulationService.stressTest(req)));
    }

    @Operation(summary = "차트 시계열 데이터 생성")
    @PostMapping("/chart-data")
    public ResponseEntity<ApiResponse<ChartDataResponse>> chartData(
            @Valid @RequestBody SimulationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(simulationService.chartData(req)));
    }
}
