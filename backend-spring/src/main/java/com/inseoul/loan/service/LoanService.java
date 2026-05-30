package com.inseoul.loan.service;

import com.inseoul.loan.domain.LoanProduct;
import com.inseoul.loan.dto.EligibilityRequest;
import com.inseoul.loan.dto.EligibilityResult;
import com.inseoul.loan.dto.LoanProductDto;
import com.inseoul.loan.mapper.LoanMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanMapper loanMapper;

    public List<LoanProductDto> getProducts() {
        return loanMapper.findAll().stream()
                .map(p -> LoanProductDto.builder()
                        .key(p.getProdKey())
                        .name(p.getName())
                        .type(p.getType())
                        .rateText(p.getRateText())
                        .loanLimit(p.getLoanLimit())
                        .conditionText(p.getConditionText())
                        .build())
                .collect(Collectors.toList());
    }

    public List<EligibilityResult> evaluateEligibility(EligibilityRequest req) {
        int annualIncome = req.getIncome() * 12;
        int age = req.getAge();
        int targetAmount = req.getTargetAmount();

        return List.of(
            checkBogeumjari(annualIncome, targetAmount),
            checkDidimdul(annualIncome, targetAmount),
            checkButimok(age)
        );
    }

    private EligibilityResult checkBogeumjari(int annualIncome, int targetAmount) {
        boolean priceOk = targetAmount <= 90_000;
        boolean incomeOk = annualIncome <= 7_000;
        boolean eligible = priceOk && incomeOk;
        String reason;
        if (eligible) {
            reason = "주택가격 9억 이하, 소득 7천만 원 이하 조건 충족";
        } else if (!priceOk) {
            reason = "목표 주택 가격이 9억을 초과합니다";
        } else {
            reason = "부부합산 연소득이 7천만 원을 초과합니다";
        }
        return EligibilityResult.builder()
                .productKey("bogeumjari")
                .productName("보금자리론")
                .eligible(eligible)
                .reason(reason)
                .maxLoan(eligible ? 36_000 : 0)
                .build();
    }

    private EligibilityResult checkDidimdul(int annualIncome, int targetAmount) {
        boolean priceOk = targetAmount <= 50_000;
        boolean incomeOk = annualIncome <= 7_000;
        boolean eligible = priceOk && incomeOk;
        String reason;
        if (eligible) {
            reason = "주택가격 5억 이하, 소득 7천만 원 이하 조건 충족";
        } else if (!priceOk) {
            reason = "목표 주택 가격이 5억을 초과합니다";
        } else {
            reason = "부부합산 연소득이 7천만 원을 초과합니다";
        }
        return EligibilityResult.builder()
                .productKey("didimdul")
                .productName("디딤돌 대출")
                .eligible(eligible)
                .reason(reason)
                .maxLoan(eligible ? 25_000 : 0)
                .build();
    }

    private EligibilityResult checkButimok(int age) {
        boolean eligible = age <= 34;
        return EligibilityResult.builder()
                .productKey("butimok")
                .productName("청년전용 버팀목 전세자금")
                .eligible(eligible)
                .reason(eligible ? "만 34세 이하 청년 조건 충족" : "만 34세 초과로 청년 기준 미충족")
                .maxLoan(eligible ? 7_000 : 0)
                .build();
    }
}
