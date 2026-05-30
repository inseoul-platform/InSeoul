package com.inseoul.district.mapper;

import com.inseoul.district.domain.DistrictPriceCache;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DistrictPriceCacheMapper {
    List<DistrictPriceCache> findAll();
    DistrictPriceCache findByCode(@Param("code") String code);
    void upsert(DistrictPriceCache cache);
    void upsertAll(List<DistrictPriceCache> caches);
}
