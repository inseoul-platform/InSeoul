package com.inseoul.loan.controller;

import com.inseoul.common.dto.ApiResponse;
import com.inseoul.loan.dto.EligibilityRequest;
import com.inseoul.loan.dto.EligibilityResult;
import com.inseoul.loan.dto.LoanProductDto;
import com.inseoul.loan.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Loan", description = "정책 대출 상품 API")
@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @Operation(summary = "정책 대출 상품 목록 조회")
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<LoanProductDto>>> getProducts() {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getProducts()));
    }

    @Operation(summary = "정책 대출 적격성 판정")
    @PostMapping("/eligibility")
    public ResponseEntity<ApiResponse<List<EligibilityResult>>> checkEligibility(
            @Valid @RequestBody EligibilityRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.evaluateEligibility(req)));
    }
}
