package com.inseoul.health;

import com.inseoul.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@Tag(name = "Health", description = "서버 상태 확인")
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final SqlSessionFactory sqlSessionFactory;

    @Operation(summary = "서버 헬스 체크")
    @GetMapping
    public ApiResponse<Map<String, String>> health() {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("db", checkDb());
        return ApiResponse.ok(status);
    }

    private String checkDb() {
        try (var session = sqlSessionFactory.openSession()) {
            session.getConnection();
            return "UP";
        } catch (Exception e) {
            return "DOWN";
        }
    }
}
