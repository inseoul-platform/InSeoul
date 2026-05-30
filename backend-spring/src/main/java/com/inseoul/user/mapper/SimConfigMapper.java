package com.inseoul.user.mapper;

import com.inseoul.user.domain.SimConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SimConfigMapper {

    SimConfig findByUserId(@Param("userId") Long userId);

    void update(SimConfig simConfig);
}
