package com.inseoul.auth.oauth2;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class OAuthAttributes {

    private String provider;
    private String providerUserId;
    private String email;
    private String nickname;

    public static OAuthAttributes of(String provider, Map<String, Object> attributes) {
        return switch (provider) {
            case "kakao" -> ofKakao(attributes);
            case "google" -> ofGoogle(attributes);
            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }

    private static OAuthAttributes ofKakao(Map<String, Object> attributes) {
        // OIDC 모드: ID 토큰 클레임이 최상위에 위치 (sub, nickname)
        String nickname = attributes.get("nickname") != null
                ? (String) attributes.get("nickname") : "카카오사용자";
        return OAuthAttributes.builder()
                .provider("kakao")
                .providerUserId((String) attributes.get("sub"))
                .email((String) attributes.get("email"))
                .nickname(nickname)
                .build();
    }

    private static OAuthAttributes ofGoogle(Map<String, Object> attributes) {
        return OAuthAttributes.builder()
                .provider("google")
                .providerUserId((String) attributes.get("sub"))
                .email((String) attributes.get("email"))
                .nickname((String) attributes.get("name"))
                .build();
    }
}
