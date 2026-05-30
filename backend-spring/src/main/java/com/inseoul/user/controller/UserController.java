package com.inseoul.user.controller;

import com.inseoul.common.dto.ApiResponse;
import com.inseoul.user.dto.SimConfigDto;
import com.inseoul.user.dto.UserMeResponse;
import com.inseoul.user.dto.UserProfileDto;
import com.inseoul.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 프로필 API")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 전체 조회 (user + profile + simConfig)")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> getMe(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getMe(userId)));
    }

    @Operation(summary = "재무 프로필 수정")
    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UserProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(userId, dto)));
    }

    @Operation(summary = "시뮬레이션 설정 수정")
    @PutMapping("/me/sim-config")
    public ResponseEntity<ApiResponse<SimConfigDto>> updateSimConfig(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SimConfigDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateSimConfig(userId, dto)));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(@AuthenticationPrincipal Long userId) {
        userService.deleteMe(userId);
        return ResponseEntity.noContent().build();
    }
}
