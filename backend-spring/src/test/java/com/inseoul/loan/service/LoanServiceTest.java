package com.inseoul.loan.service;

import com.inseoul.loan.dto.EligibilityRequest;
import com.inseoul.loan.dto.EligibilityResult;
import com.inseoul.loan.mapper.LoanMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanMapper loanMapper;

    @InjectMocks
    private LoanService loanService;

    private EligibilityRequest buildRequest(int age, int income, int targetAmount, int cash) {
        try {
            EligibilityRequest req = new EligibilityRequest();
            setField(req, "age", age);
            setField(req, "income", income);
            setField(req, "targetAmount", targetAmount);
            setField(req, "cash", cash);
            return req;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setField(Object obj, String fieldName, Object value) throws Exception {
        var field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    @Test
    void evaluateEligibility_저소득저가_3개모두적합() {
        EligibilityRequest req = buildRequest(28, 400, 45000, 10000);

        List<EligibilityResult> results = loanService.evaluateEligibility(req);

        assertThat(results).hasSize(3);
        assertThat(results).allMatch(EligibilityResult::isEligible);
    }

    @Test
    void evaluateEligibility_고소득_보금자리디딤돌부적합() {
        // 월소득 700 → 연소득 8400 > 7000 → 보금자리·디딤돌 부적합
        EligibilityRequest req = buildRequest(28, 700, 45000, 10000);

        List<EligibilityResult> results = loanService.evaluateEligibility(req);

        EligibilityResult bogeumjari = results.stream().filter(r -> "bogeumjari".equals(r.getProductKey())).findFirst().orElseThrow();
        EligibilityResult didimdul   = results.stream().filter(r -> "didimdul".equals(r.getProductKey())).findFirst().orElseThrow();
        EligibilityResult butimok    = results.stream().filter(r -> "butimok".equals(r.getProductKey())).findFirst().orElseThrow();

        assertThat(bogeumjari.isEligible()).isFalse();
        assertThat(didimdul.isEligible()).isFalse();
        assertThat(butimok.isEligible()).isTrue(); // 나이 28세
    }

    @Test
    void evaluateEligibility_고가주택_디딤돌부적합() {
        // target 60000 > 50000 → 디딤돌 부적합
        EligibilityRequest req = buildRequest(28, 400, 60000, 10000);

        List<EligibilityResult> results = loanService.evaluateEligibility(req);

        EligibilityResult didimdul = results.stream().filter(r -> "didimdul".equals(r.getProductKey())).findFirst().orElseThrow();
        assertThat(didimdul.isEligible()).isFalse();
    }

    @Test
    void evaluateEligibility_35세이상_버팀목부적합() {
        EligibilityRequest req = buildRequest(35, 400, 45000, 10000);

        List<EligibilityResult> results = loanService.evaluateEligibility(req);

        EligibilityResult butimok = results.stream().filter(r -> "butimok".equals(r.getProductKey())).findFirst().orElseThrow();
        assertThat(butimok.isEligible()).isFalse();
    }

    @Test
    void getProducts_매퍼위임확인() {
        var product = new com.inseoul.loan.domain.LoanProduct();
        product.setProdKey("bogeumjari");
        product.setName("보금자리론");
        product.setType("전세");
        product.setRateText("3.0%");
        product.setLoanLimit(36000);
        product.setConditionText("조건");
        when(loanMapper.findAll()).thenReturn(List.of(product));

        var dtos = loanService.getProducts();

        assertThat(dtos).hasSize(1);
        assertThat(dtos.get(0).getKey()).isEqualTo("bogeumjari");
        assertThat(dtos.get(0).getName()).isEqualTo("보금자리론");
    }
}
