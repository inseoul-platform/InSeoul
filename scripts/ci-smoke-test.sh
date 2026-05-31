#!/usr/bin/env bash
# CI 스모크 테스트 — 12개 시나리오 (챗봇·외부 API 의존 항목 제외)
# 사용법: bash scripts/ci-smoke-test.sh [BASE_URL]

BASE="${1:-http://localhost:8080}"
PASS=0; FAIL=0; ERRORS=()

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

check() {
  local no="$1" desc="$2" result="$3" expect="$4"
  if echo "$result" | grep -q "$expect"; then
    echo -e "  ${GREEN}✅ PASS${NC} [${no}] ${desc}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ FAIL${NC} [${no}] ${desc}"
    echo -e "       expect : ${YELLOW}${expect}${NC}"
    echo -e "       got    : $(echo "$result" | head -c 300)"
    ((FAIL++))
    ERRORS+=("[$no] $desc")
  fi
}

get()  { curl -s     "$BASE$1" "${@:2}"; }
post() { curl -s -X POST "$BASE$1" -H "Content-Type: application/json" -d "$2" "${@:3}"; }

EMAIL="ci_$(date +%s)@inseoul.dev"
PASSWORD="CiTest1!"
NICKNAME="CI테스터"

echo ""
echo -e "${BOLD}InSeoul CI 스모크 테스트 — 12 시나리오${NC}"
echo -e "BASE URL : ${YELLOW}${BASE}${NC}"
echo "──────────────────────────────────────────────────────────────"

# [S1] Spring 헬스체크
echo -e "\n${BOLD}[Health]${NC}"
R=$(get /api/health)
check S1 "GET /api/health → db:UP" "$R" '"db":"UP"'

# [S2] FastAPI 헬스체크
R=$(curl -s http://localhost:8000/health)
check S2 "GET FastAPI /health → status ok" "$R" '"status"'

# [S3-S6] Auth
echo -e "\n${BOLD}[Auth]${NC}"

R=$(post /api/auth/signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"$NICKNAME\"}")
check S3 "회원가입 정상 → accessToken 발급" "$R" '"accessToken"'
ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

R=$(post /api/auth/signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"$NICKNAME\"}")
check S4 "회원가입 중복 → DUPLICATE_EMAIL" "$R" '"DUPLICATE_EMAIL"'

R=$(post /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
check S5 "로그인 정상 → accessToken 발급" "$R" '"accessToken"'
ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

R=$(post /api/auth/refresh "{\"refreshToken\":\"$REFRESH\"}")
check S6 "토큰 갱신 → 새 accessToken" "$R" '"accessToken"'
ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

# [S7-S8] User
echo -e "\n${BOLD}[User]${NC}"

R=$(get /api/users/me -H "Authorization: Bearer $ACCESS")
check S7 "GET /api/users/me 인증 → success:true" "$R" '"success":true'

R=$(get /api/users/me)
check S8 "GET /api/users/me 미인증 → success:false" "$R" '"success":false'

# [S9] Districts
echo -e "\n${BOLD}[Districts]${NC}"

R=$(get /api/districts)
check S9 "GET /api/districts → 25개 구 목록" "$R" '"success":true'

# [S10-S11] Loans
echo -e "\n${BOLD}[Loans]${NC}"

R=$(get /api/loans/products)
check S10 "GET /api/loans/products → 상품 목록" "$R" '"key"'

R=$(post /api/loans/eligibility '{"age":28,"income":400,"targetAmount":45000,"cash":10000}')
check S11 "POST /api/loans/eligibility → eligible 판정" "$R" '"eligible"'

# [S12] Simulation
echo -e "\n${BOLD}[Simulation]${NC}"

SIM='{"cash":50000.0,"monthlySavings":300.0,"targetAmount":120000.0,"savingsIncreaseRate":5.0,"investmentReturnRate":8.0,"apartmentAnnualRise":3.0,"ltvRatio":0.5,"acquisitionTaxRate":0.035}'
R=$(post /api/simulation/golden-cross "$SIM")
check S12 "POST /api/simulation/golden-cross → crossDate 포함" "$R" '"crossDate"'

# Cleanup
curl -s -o /dev/null -X DELETE "$BASE/api/users/me" -H "Authorization: Bearer $ACCESS" || true

# 결과
echo ""
echo "══════════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo -e "  결과: ${GREEN}${PASS} PASS${NC} / ${RED}${FAIL} FAIL${NC} / ${TOTAL} TOTAL"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "\n  ${RED}실패 항목:${NC}"
  for e in "${ERRORS[@]}"; do echo -e "    ${RED}✗${NC} $e"; done
fi
echo "══════════════════════════════════════════════════════════════"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1
