package com.inseoul.user.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserProfile {
    private Long userId;
    private int cash;
    private int monthlySavings;
    private int targetAmount;
    private int age;
    private int income;
    private LocalDateTime updatedAt;
}
