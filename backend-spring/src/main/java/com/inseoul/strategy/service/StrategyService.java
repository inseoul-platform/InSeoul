package com.inseoul.strategy.service;

import com.inseoul.common.exception.BaseException;
import com.inseoul.common.exception.ErrorCode;
import com.inseoul.strategy.domain.Strategy;
import com.inseoul.strategy.domain.StrategyStep;
import com.inseoul.strategy.dto.StrategyDetailDto;
import com.inseoul.strategy.dto.StrategyDto;
import com.inseoul.strategy.mapper.StrategyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StrategyService {

    private final StrategyMapper strategyMapper;

    public List<StrategyDto> getAll() {
        return strategyMapper.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public StrategyDetailDto getDetail(String type) {
        Strategy s = strategyMapper.findByType(type);
        if (s == null) throw new BaseException(ErrorCode.NOT_FOUND);

        List<StrategyStep> steps = strategyMapper.findStepsByType(type);
        return StrategyDetailDto.builder()
                .type(s.getType())
                .badge(s.getBadge())
                .title(s.getTitle())
                .subtitle(s.getSubtitle())
                .riskLevel(s.getRiskLevel())
                .riskBadge(s.getRiskBadge())
                .accentGradient(s.getAccentGradient())
                .targetPrice(s.getTargetPrice())
                .steps(steps.stream()
                        .map(step -> StrategyDetailDto.StepDto.builder()
                                .order(step.getStepOrder())
                                .title(step.getTitle())
                                .description(step.getDescription())
                                .icon(step.getIcon())
                                .phasePct(step.getPhasePct())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private StrategyDto toDto(Strategy s) {
        return StrategyDto.builder()
                .type(s.getType())
                .badge(s.getBadge())
                .title(s.getTitle())
                .subtitle(s.getSubtitle())
                .riskLevel(s.getRiskLevel())
                .riskBadge(s.getRiskBadge())
                .accentGradient(s.getAccentGradient())
                .targetPrice(s.getTargetPrice())
                .build();
    }
}
