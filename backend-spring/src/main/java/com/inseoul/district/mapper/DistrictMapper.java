package com.inseoul.district.mapper;

import com.inseoul.district.domain.District;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DistrictMapper {
    List<District> findAll();
    District findByCode(String code);
}
