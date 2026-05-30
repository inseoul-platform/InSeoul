package com.inseoul.auth.mapper;

import com.inseoul.auth.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    void insert(User user);

    User findByEmail(@Param("email") String email);

    User findById(@Param("id") Long id);

    boolean existsByEmail(@Param("email") String email);

    void insertOAuthAccount(@Param("userId") Long userId,
                            @Param("provider") String provider,
                            @Param("providerUserId") String providerUserId);

    User findByProviderAndProviderUserId(@Param("provider") String provider,
                                        @Param("providerUserId") String providerUserId);

    void insertDefaultProfile(@Param("userId") Long userId);

    void insertDefaultSimConfig(@Param("userId") Long userId);

    void deleteById(@Param("id") Long id);
}
