package com.inseoul.user.service;

import com.inseoul.auth.domain.User;
import com.inseoul.auth.dto.TokenResponse;
import com.inseoul.auth.mapper.RefreshTokenMapper;
import com.inseoul.auth.mapper.UserMapper;
import com.inseoul.common.exception.BaseException;
import com.inseoul.common.exception.ErrorCode;
import com.inseoul.user.domain.SimConfig;
import com.inseoul.user.domain.UserProfile;
import com.inseoul.user.dto.SimConfigDto;
import com.inseoul.user.dto.UserMeResponse;
import com.inseoul.user.dto.UserProfileDto;
import com.inseoul.user.mapper.SimConfigMapper;
import com.inseoul.user.mapper.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserProfileMapper userProfileMapper;
    private final SimConfigMapper simConfigMapper;
    private final RefreshTokenMapper refreshTokenMapper;

    @Transactional(readOnly = true)
    public UserMeResponse getMe(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) throw new BaseException(ErrorCode.USER_NOT_FOUND);

        UserProfile profile = userProfileMapper.findByUserId(userId);
        SimConfig simConfig = simConfigMapper.findByUserId(userId);

        return UserMeResponse.builder()
                .user(toUserInfo(user))
                .profile(toProfileDto(profile))
                .simConfig(toSimConfigDto(simConfig))
                .build();
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UserProfileDto dto) {
        if (userMapper.findById(userId) == null) throw new BaseException(ErrorCode.USER_NOT_FOUND);

        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .cash(dto.getCash())
                .monthlySavings(dto.getMonthlySavings())
                .targetAmount(dto.getTargetAmount())
                .age(dto.getAge())
                .income(dto.getIncome())
                .build();
        userProfileMapper.update(profile);

        return toProfileDto(userProfileMapper.findByUserId(userId));
    }

    @Transactional
    public SimConfigDto updateSimConfig(Long userId, SimConfigDto dto) {
        if (userMapper.findById(userId) == null) throw new BaseException(ErrorCode.USER_NOT_FOUND);

        SimConfig config = SimConfig.builder()
                .userId(userId)
                .savingsIncreaseRate(dto.getSavingsIncreaseRate())
                .investmentReturnRate(dto.getInvestmentReturnRate())
                .apartmentAnnualRise(dto.getApartmentAnnualRise())
                .ltvRatio(dto.getLtvRatio())
                .acquisitionTaxRate(dto.getAcquisitionTaxRate())
                .build();
        simConfigMapper.update(config);

        return toSimConfigDto(simConfigMapper.findByUserId(userId));
    }

    @Transactional
    public void deleteMe(Long userId) {
        if (userMapper.findById(userId) == null) throw new BaseException(ErrorCode.USER_NOT_FOUND);
        refreshTokenMapper.revokeAllByUserId(userId);
        userMapper.deleteById(userId);
    }

    // ─── 변환 헬퍼 ───────────────────────────────────────────

    private TokenResponse.UserInfo toUserInfo(User user) {
        return TokenResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .provider(user.getProvider())
                .build();
    }

    private UserProfileDto toProfileDto(UserProfile p) {
        if (p == null) return null;
        return UserProfileDto.builder()
                .cash(p.getCash())
                .monthlySavings(p.getMonthlySavings())
                .targetAmount(p.getTargetAmount())
                .age(p.getAge())
                .income(p.getIncome())
                .build();
    }

    private SimConfigDto toSimConfigDto(SimConfig c) {
        if (c == null) return null;
        return SimConfigDto.builder()
                .savingsIncreaseRate(c.getSavingsIncreaseRate())
                .investmentReturnRate(c.getInvestmentReturnRate())
                .apartmentAnnualRise(c.getApartmentAnnualRise())
                .ltvRatio(c.getLtvRatio())
                .acquisitionTaxRate(c.getAcquisitionTaxRate())
                .build();
    }
}
