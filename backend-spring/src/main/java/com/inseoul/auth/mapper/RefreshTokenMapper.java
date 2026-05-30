package com.inseoul.auth.mapper;

import com.inseoul.auth.domain.RefreshToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    void insert(RefreshToken token);

    RefreshToken findByTokenHash(@Param("tokenHash") String tokenHash);

    void revokeByTokenHash(@Param("tokenHash") String tokenHash);

    void revokeAllByUserId(@Param("userId") Long userId);
}
