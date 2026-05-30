package com.inseoul.loan.mapper;

import com.inseoul.loan.domain.LoanProduct;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface LoanMapper {
    List<LoanProduct> findAll();
}
