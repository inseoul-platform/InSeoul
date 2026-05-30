package com.inseoul.district.service;

import com.inseoul.district.domain.District;
import com.inseoul.district.domain.DistrictPriceCache;
import com.inseoul.district.dto.DistrictDetailPriceDto;
import com.inseoul.district.dto.DistrictDto;
import com.inseoul.district.dto.DistrictPriceDto;
import com.inseoul.district.external.MolitClient;
import com.inseoul.district.mapper.DistrictMapper;
import com.inseoul.district.mapper.DistrictPriceCacheMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DistrictService {

    private static final int CACHE_TTL_HOURS = 24;

    private final DistrictMapper districtMapper;
    private final DistrictPriceCacheMapper cacheMapper;
    private final MolitClient molitClient;

    public List<DistrictDto> getAllDistricts() {
        return districtMapper.findAll().stream()
                .map(d -> DistrictDto.builder()
                        .code(d.getCode())
                        .region(d.getRegion())
                        .lat(d.getLat())
                        .lng(d.getLng())
                        .tierDefault(d.getTierDefault())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<DistrictPriceDto> getAllPrices(boolean forceRefresh) {
        List<District> districts = districtMapper.findAll();
        Map<String, DistrictPriceCache> cacheMap = cacheMapper.findAll().stream()
                .collect(Collectors.toMap(DistrictPriceCache::getCode, Function.identity()));

        LocalDateTime staleThreshold = LocalDateTime.now().minusHours(CACHE_TTL_HOURS);

        for (District d : districts) {
            DistrictPriceCache cached = cacheMap.get(d.getCode());
            boolean needsRefresh = forceRefresh
                    || cached == null
                    || cached.getFetchedAt() == null
                    || cached.getFetchedAt().isBefore(staleThreshold);

            if (needsRefresh) {
                refreshCache(d);
            }
        }

        Map<String, DistrictPriceCache> updatedMap = cacheMapper.findAll().stream()
                .collect(Collectors.toMap(DistrictPriceCache::getCode, Function.identity()));

        return districts.stream()
                .map(d -> {
                    DistrictPriceCache c = updatedMap.get(d.getCode());
                    return DistrictPriceDto.builder()
                            .code(d.getCode())
                            .region(d.getRegion())
                            .tradeAvg(c != null ? c.getTradeAvg() : null)
                            .rentAvg(c != null ? c.getRentAvg() : null)
                            .fetchedAt(c != null ? c.getFetchedAt() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public DistrictDetailPriceDto getDistrictPrice(String code) {
        District district = districtMapper.findByCode(code);
        if (district == null) return null;

        DistrictPriceCache cached = cacheMapper.findByCode(code);
        LocalDateTime staleThreshold = LocalDateTime.now().minusHours(CACHE_TTL_HOURS);

        if (cached == null || cached.getFetchedAt() == null || cached.getFetchedAt().isBefore(staleThreshold)) {
            cached = refreshCache(district);
        }

        return DistrictDetailPriceDto.builder()
                .code(district.getCode())
                .region(district.getRegion())
                .tradeAvg(cached != null ? cached.getTradeAvg() : null)
                .rentAvg(cached != null ? cached.getRentAvg() : null)
                .byMonth(List.of())
                .build();
    }

    /** 외부 API 호출 후 캐시 갱신. API 키 미설정 시 기존 캐시 유지. */
    public DistrictPriceCache refreshCache(District district) {
        MolitClient.MolitPriceResult result = molitClient.fetchAvgPrice(district.getCode());
        if (result == null) {
            return cacheMapper.findByCode(district.getCode());
        }

        DistrictPriceCache cache = new DistrictPriceCache();
        cache.setCode(district.getCode());
        cache.setTradeAvg(result.tradeAvg());
        cache.setRentAvg(result.rentAvg());
        cacheMapper.upsert(cache);
        log.info("Refreshed price cache for {} ({}): trade={}, rent={}",
                district.getRegion(), district.getCode(), result.tradeAvg(), result.rentAvg());
        return cacheMapper.findByCode(district.getCode());
    }

    /** 스케줄러에서 호출 — 모든 구 일괄 갱신 */
    @Transactional
    public void refreshAllCache() {
        log.info("Starting scheduled price cache refresh for all districts");
        List<District> districts = districtMapper.findAll();
        for (District d : districts) {
            try {
                refreshCache(d);
            } catch (Exception e) {
                log.error("Failed to refresh cache for {}: {}", d.getCode(), e.getMessage());
            }
        }
        log.info("Scheduled price cache refresh completed");
    }
}
