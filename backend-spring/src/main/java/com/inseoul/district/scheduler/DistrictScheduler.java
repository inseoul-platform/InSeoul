package com.inseoul.district.scheduler;

import com.inseoul.district.service.DistrictService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DistrictScheduler {

    private final DistrictService districtService;

    /** 매일 새벽 4시 전체 구 가격 캐시 갱신 */
    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    public void refreshAllPrices() {
        log.info("Scheduled district price refresh triggered");
        districtService.refreshAllCache();
    }
}
