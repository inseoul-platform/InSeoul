package com.inseoul.auth.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RefreshToken {
    private Long id;
    private Long userId;
    private String tokenHash;   // SHA-256 해시
    private LocalDateTime expiresAt;
    private boolean revoked;
}
