package com.inseoul.user.dto;

import com.inseoul.auth.dto.TokenResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserMeResponse {
    private TokenResponse.UserInfo user;
    private UserProfileDto profile;
    private SimConfigDto simConfig;
}
