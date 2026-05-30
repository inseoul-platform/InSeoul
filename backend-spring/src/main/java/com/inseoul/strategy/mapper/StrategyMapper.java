package com.inseoul.strategy.mapper;

import com.inseoul.strategy.domain.Strategy;
import com.inseoul.strategy.domain.StrategyStep;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StrategyMapper {
    List<Strategy> findAll();
    Strategy findByType(@Param("type") String type);
    List<StrategyStep> findStepsByType(@Param("type") String type);
}
