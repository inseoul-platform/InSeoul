#!/usr/bin/env bash
# InSeoul 백엔드 회귀 시나리오 25종
# 사용법: bash scripts/regression_test.sh [BASE_URL]
# 기본값: http://localhost:8080

BASE="${1:-http://localhost:8080}"
PASS=0; FAIL=0; ERRORS=()

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

check() {
  local no="$1" desc="$2" result="$3" expect="$4"
  if echo "$result" | grep -q "$expect"; then
    echo -e "  ${GREEN}✅ PASS${NC} [${no}] ${desc}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ FAIL${NC} [${no}] ${desc}"
    echo -e "       expect : ${YELLOW}${expect}${NC}"
    echo -e "       got    : $(echo "$result" | head -c 200)"
    ((FAIL++))
    ERRORS+=("[$no] $desc")
  fi
}

get()  { curl -s     "$BASE$1" "${@:2}"; }
post() { curl -s -X POST "$BASE$1" -H "Content-Type: application/json" -d "$2" "${@:3}"; }
put()  { curl -s -X PUT  "$BASE$1" -H "Content-Type: application/json" -d "$2" "${@:3}"; }

# ── 테스트 계정 (매 실행 시 고유 이메일) ─────────────────────────────────────
EMAIL="regtest_$(date +%s)@inseoul.dev"
PASSWORD="Regtest1!"
NICKNAME="회귀테스터"

echo ""
echo -e "${BOLD}InSeoul 백엔드 회귀 테스트 — 25 시나리오${NC}"
echo -e "BASE URL : ${YELLOW}${BASE}${NC}"
echo -e "계정     : ${EMAIL}"
echo "──────────────────────────────────────────────────────────────"

# ── [1] Health ────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Auth / Health]${NC}"

R=$(get /api/health)
check 1 "GET /api/health → DB UP" "$R" '"db":"UP"'

# ── [2-6] Auth ────────────────────────────────────────────────────────────────

R=$(post /api/auth/signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"$NICKNAME\"}")
check 2 "회원가입 정상 → accessToken 발급" "$R" '"accessToken"'
ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

R=$(post /api/auth/signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"$NICKNAME\"}")
check 3 "회원가입 중복 이메일 → DUPLICATE_EMAIL" "$R" '"DUPLICATE_EMAIL"'

R=$(post /api/auth/signup '{"email":"not-an-email","password":"Test1234!","nickname":"닉"}')
check 4 "회원가입 이메일 형식 오류 → INVALID_INPUT" "$R" '"INVALID_INPUT"'

R=$(post /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
check 5 "로그인 정상 → accessToken 발급" "$R" '"accessToken"'
ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

R=$(post /api/auth/login "{\"email\":\"$EMAIL\",\"password\":\"WrongPass99!\"}")
check 6 "로그인 잘못된 비밀번호 → success:false" "$R" '"success":false'

# ── [7-8] Token Refresh ───────────────────────────────────────────────────────
echo -e "\n${BOLD}[Token]${NC}"

R=$(post /api/auth/refresh "{\"refreshToken\":\"$REFRESH\"}")
check 7 "refresh → 새 토큰 쌍 발급 (rotation)" "$R" '"accessToken"'
NEW_ACCESS=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
NEW_REFRESH=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

R=$(post /api/auth/refresh '{"refreshToken":"invalid.token.here"}')
check 8 "잘못된 refresh token → success:false" "$R" '"success":false'

# 이후 테스트에 갱신된 토큰 사용
ACCESS="$NEW_ACCESS"
AUTH_HEADER="-H \"Authorization: Bearer $ACCESS\""

# ── [9-12] User ───────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[User]${NC}"

R=$(get /api/users/me -H "Authorization: Bearer $ACCESS")
check 9 "GET /api/users/me JWT 인증 정상" "$R" '"success":true'

R=$(get /api/users/me)
check 10 "GET /api/users/me 토큰 없음 → 401" "$R" '"success":false'

R=$(put /api/users/me/profile \
  '{"cash":80000,"monthlySavings":400,"targetAmount":150000,"age":32,"income":600}' \
  -H "Authorization: Bearer $ACCESS")
check 11 "PUT /api/users/me/profile 업데이트 → success:true" "$R" '"success":true'

R=$(put /api/users/me/sim-config \
  '{"savingsIncreaseRate":5.0,"investmentReturnRate":8.0,"apartmentAnnualRise":3.0,"ltvRatio":0.5,"acquisitionTaxRate":0.035}' \
  -H "Authorization: Bearer $ACCESS")
check 12 "PUT /api/users/me/sim-config 업데이트 → success:true" "$R" '"success":true'

# ── [13-15] Districts ─────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Districts]${NC}"

R=$(get /api/districts)
CNT=$(echo "$R" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
check 13 "GET /api/districts → 25개 구 카탈로그" "$R" '"success":true'
[ "$CNT" = "25" ] && echo -e "       count  : ${GREEN}25${NC}" || echo -e "       count  : ${RED}${CNT} (expected 25)${NC}"

R=$(get /api/districts/prices)
check 14 "GET /api/districts/prices → MOLIT 시세 포함" "$R" '"tradeAvg"'

R=$(get /api/districts/11110/prices)
check 15 "GET /api/districts/11110/prices → 종로구 단건" "$R" '"success":true'

# ── [16-18] Loans ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Loans]${NC}"

R=$(get /api/loans/products)
check 16 "GET /api/loans/products → 상품 목록" "$R" '"key"'

R=$(post /api/loans/eligibility \
  '{"age":32,"income":4000,"targetAmount":120000,"cash":50000}')
check 17 "POST /api/loans/eligibility 정상 → 판정 결과 3종" "$R" '"eligible"'

R=$(post /api/loans/eligibility '{"income":4000}')
check 18 "POST /api/loans/eligibility 필수 필드 누락 → INVALID_INPUT" "$R" '"success":false'

# ── [19-20] Strategies ────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Strategies]${NC}"

R=$(get /api/strategies)
check 19 "GET /api/strategies → 전략 목록" "$R" '"success":true'

R=$(get /api/strategies/relay)
check 20 "GET /api/strategies/relay → 경유 전략 상세" "$R" '"success":true'

# ── [21-24] Simulation ────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Simulation]${NC}"

SIM_BODY='{"cash":50000.0,"monthlySavings":300.0,"targetAmount":120000.0,"savingsIncreaseRate":5.0,"investmentReturnRate":8.0,"apartmentAnnualRise":3.0,"ltvRatio":0.5,"acquisitionTaxRate":0.035}'

R=$(post /api/simulation/golden-cross "$SIM_BODY")
check 21 "POST /api/simulation/golden-cross → crossDate 포함" "$R" '"crossDate"'

R=$(post /api/simulation/golden-cross '{"cash":null}')
check 22 "POST /api/simulation/golden-cross 필수 필드 null → INVALID_INPUT" "$R" '"success":false'

R=$(post /api/simulation/stress-test "$SIM_BODY")
check 23 "POST /api/simulation/stress-test → 시나리오 결과" "$R" '"success":true'

R=$(post /api/simulation/chart-data "$SIM_BODY")
check 24 "POST /api/simulation/chart-data → 시계열 데이터" "$R" '"success":true'

# ── [25] Chat SSE ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[Chat SSE]${NC}"

SSE_TMP=$(mktemp)
curl -s -N --no-buffer -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"디딤돌 대출 조건 알려줘","pageContext":"dashboard","userProfile":{"cash":50000,"monthlySavings":300}}' \
  --max-time 30 > "$SSE_TMP" 2>&1 || true
R=$(head -3 "$SSE_TMP"); rm -f "$SSE_TMP"
check 25 "POST /api/chat → SSE delta 이벤트 수신" "$R" '"type".*"delta"'

# ── Cleanup: 테스트 계정 탈퇴 ─────────────────────────────────────────────────
echo -e "\n${BOLD}[Cleanup]${NC}"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/users/me" \
  -H "Authorization: Bearer $ACCESS")
if [ "$HTTP_STATUS" = "204" ]; then
  echo -e "  ${GREEN}✅ 테스트 계정 탈퇴 완료${NC} (${EMAIL}) — users + profiles + sim_configs + refresh_tokens CASCADE 삭제"
else
  echo -e "  ${YELLOW}⚠️  탈퇴 응답 코드: ${HTTP_STATUS}${NC} (수동 확인 필요)"
fi

# ── 결과 요약 ─────────────────────────────────────────────────────────────────
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
