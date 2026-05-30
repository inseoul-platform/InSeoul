package com.inseoul.auth.service;

import com.inseoul.auth.domain.RefreshToken;
import com.inseoul.auth.domain.User;
import com.inseoul.auth.dto.LoginRequest;
import com.inseoul.auth.dto.SignupRequest;
import com.inseoul.auth.dto.TokenResponse;
import com.inseoul.auth.mapper.RefreshTokenMapper;
import com.inseoul.auth.mapper.UserMapper;
import com.inseoul.auth.security.JwtTokenProvider;
import com.inseoul.common.exception.BaseException;
import com.inseoul.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new BaseException(ErrorCode.DUPLICATE_EMAIL);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .provider("local")
                .nickname(request.getNickname())
                .role("USER")
                .build();

        userMapper.insert(user);
        userMapper.insertDefaultProfile(user.getId());
        userMapper.insertDefaultSimConfig(user.getId());

        return issueTokens(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userMapper.findByEmail(request.getEmail());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BaseException(ErrorCode.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return issueTokens(user);
    }

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        String hash = sha256(refreshTokenValue);
        RefreshToken stored = refreshTokenMapper.findByTokenHash(hash);

        if (stored == null || stored.isRevoked()) {
            throw new BaseException(ErrorCode.TOKEN_INVALID);
        }
        if (stored.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new BaseException(ErrorCode.TOKEN_EXPIRED);
        }

        refreshTokenMapper.revokeByTokenHash(hash);

        User user = userMapper.findById(stored.getUserId());
        if (user == null) {
            throw new BaseException(ErrorCode.USER_NOT_FOUND);
        }
        return issueTokens(user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenMapper.revokeAllByUserId(userId);
    }

    public TokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(user.getId());

        RefreshToken token = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(sha256(refreshTokenValue))
                .expiresAt(jwtTokenProvider.getRefreshTokenExpiry())
                .build();
        refreshTokenMapper.insert(token);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .user(TokenResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .nickname(user.getNickname())
                        .provider(user.getProvider())
                        .build())
                .build();
    }

    public TokenResponse.UserInfo getUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) throw new BaseException(ErrorCode.USER_NOT_FOUND);
        return TokenResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .provider(user.getProvider())
                .build();
    }

    public static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
