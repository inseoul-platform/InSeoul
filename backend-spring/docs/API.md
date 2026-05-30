# InSeoul API 명세

> **Base URL (local)**: `http://localhost:8080`  
> **인증**: `Authorization: Bearer <accessToken>` (표기: A=익명, U=인증 필요)  
> **공통 응답**: `{"success": true/false, "data": {...}, "error": {"code": "...", "message": "..."}}`

---

## 1. Health

### GET /api/health
서버 및 DB 상태 확인.

**응답 (200)**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "db": "UP"
  }
}
```

---

## 2. Auth

### POST /api/auth/signup  *(A)*
```json
// 요청
{ "email": "user@example.com", "password": "Password1!", "nickname": "닉네임" }

// 응답 200
{ "success": true, "data": { "userId": 1, "accessToken": "...", "refreshToken": "..." } }

// 오류 409 DUPLICATE_EMAIL
{ "success": false, "error": { "code": "DUPLICATE_EMAIL", "message": "이미 사용 중인 이메일입니다." } }
```

### POST /api/auth/login  *(A)*
```json
// 요청
{ "email": "user@example.com", "password": "Password1!" }

// 응답 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "email": "user@example.com", "nickname": "닉네임", "provider": "local" }
  }
}
```

### POST /api/auth/refresh  *(A)*
```json
// 요청
{ "refreshToken": "eyJ..." }

// 응답 200
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
```

### POST /api/auth/logout  *(U)*
```
// 요청: Authorization 헤더만
// 응답: 204 No Content
```

### GET /api/auth/oauth2/{provider}/login  *(A)*
- provider: `kakao` | `google`
- 302 리다이렉트 → OAuth2 인증 화면

### GET /api/auth/me  *(U)*
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "nickname": "...", "provider": "local" },
    "profile": { "cash": 5000, "monthlySavings": 300, "targetAmount": 80000, "age": 30, "income": 500 },
    "simConfig": { "savingsIncreaseRate": 5.0, "investmentReturnRate": 8.0, "apartmentAnnualRise": 3.0, "ltvRatio": 0.5, "acquisitionTaxRate": 0.035 }
  }
}
```

---

## 3. User

### GET /api/users/me  *(U)*
`/api/auth/me`와 동일한 응답.

### PUT /api/users/me/profile  *(U)*
```json
// 요청
{ "cash": 8000, "monthlySavings": 250, "targetAmount": 80000, "age": 30, "income": 500 }

// 응답 200
{ "success": true, "data": { "cash": 8000, "monthlySavings": 250, "targetAmount": 80000, "age": 30, "income": 500 } }
```

**검증**: cash 0~100,000 / monthlySavings 0~5,000 / targetAmount 0~500,000 / age 18~80 / income 0~5,000

### PUT /api/users/me/sim-config  *(U)*
```json
// 요청
{ "savingsIncreaseRate": 5.0, "investmentReturnRate": 8.0, "apartmentAnnualRise": 3.0, "ltvRatio": 0.5, "acquisitionTaxRate": 0.035 }
```

### DELETE /api/users/me  *(U)*
204 No Content. CASCADE로 profiles, sim_configs, refresh_tokens 동시 삭제.

---

## 4. Simulation

### POST /api/simulation/golden-cross  *(A/U)*
```json
// 요청
{
  "userProfile": { "cash": 8000, "monthlySavings": 250, "targetAmount": 80000, "age": 30, "income": 500 },
  "simConfig": { "savingsIncreaseRate": 5.0, "investmentReturnRate": 8.0, "apartmentAnnualRise": 3.0, "ltvRatio": 0.5, "acquisitionTaxRate": 0.035 }
}

// 응답 200
{
  "success": true,
  "data": {
    "months": 48,
    "crossDate": "2030-05",
    "requiredCapital": 45000,
    "loanAmount": 40000,
    "acquisitionTax": 2800,
    "finalAptPrice": 87000
  }
}
```

### POST /api/simulation/stress-test  *(A/U)*
```json
// 요청
{
  "userProfile": { ... },
  "simConfig": { ... },
  "scenarios": ["interestRateRise", "priceRise"]
}

// 응답 200
{
  "success": true,
  "data": {
    "base": { "months": 48, "crossDate": "2030-05" },
    "interestRateRise": { "delayMonths": 6, "crossDate": "2030-11" },
    "priceRise": { "delayMonths": 12, "crossDate": "2031-05" }
  }
}
```

### POST /api/simulation/chart-data  *(A/U)*
```json
// 요청
{ "userProfile": {...}, "simConfig": {...}, "horizonMonths": 120 }

// 응답 200
{
  "success": true,
  "data": [
    { "month": 1, "year": "2026-06", "assets": 8250, "aptPrice": 80200, "required": 41500 },
    ...
  ]
}
```

---

## 5. District

### GET /api/districts  *(A)*
```json
{
  "success": true,
  "data": [
    { "code": "11680", "region": "강남구", "lat": 37.5172, "lng": 127.0473, "tierDefault": 3 },
    ...
  ]
}
```

### GET /api/districts/prices  *(A)*
Query: `?refresh=false` (true면 강제 갱신)
```json
{
  "success": true,
  "data": [
    { "code": "11680", "region": "강남구", "tradeAvg": 192000, "rentAvg": 85000, "fetchedAt": "2026-05-15T04:00:00" },
    ...
  ]
}
```

### GET /api/districts/{code}/prices  *(A)*
```json
{
  "success": true,
  "data": { "code": "11680", "region": "강남구", "tradeAvg": 192000, "rentAvg": 85000, "fetchedAt": "2026-05-15T04:00:00" }
}
```

---

## 6. Loan

### GET /api/loans/products  *(A)*
```json
{
  "success": true,
  "data": [
    {
      "prodKey": "bogeumjari",
      "name": "보금자리론",
      "type": "구입자금",
      "rateText": "3.65~4.00%",
      "loanLimit": 36000,
      "conditionText": "주택가격 9억원 이하, 연소득 7천만원 이하"
    }
  ]
}
```

### POST /api/loans/eligibility  *(A/U)*
```json
// 요청
{ "age": 30, "income": 500, "targetAmount": 80000, "cash": 8000 }

// 응답 200
{
  "success": true,
  "data": [
    { "prodKey": "bogeumjari", "eligible": true, "reason": "자격 충족", "maxLoan": 36000 },
    { "prodKey": "didimdul", "eligible": false, "reason": "주택가격 5억원 초과", "maxLoan": 0 },
    { "prodKey": "butimok_youth", "eligible": false, "reason": "연령 초과 (34세 이하)", "maxLoan": 0 }
  ]
}
```

---

## 7. Strategy

### GET /api/strategies  *(A)*
```json
{
  "success": true,
  "data": [
    {
      "type": "relay",
      "badge": "징검다리",
      "title": "징검다리 전략",
      "subtitle": "소형 아파트를 거쳐 목표 단지로 진입",
      "riskLevel": "낮음",
      "riskBadge": "badge-success",
      "accentGradient": "from-emerald-400 to-cyan-400",
      "targetPrice": 35000
    }
  ]
}
```

### GET /api/strategies/{type}  *(A)*
type: `relay` | `downsize`
```json
{
  "success": true,
  "data": {
    "type": "relay",
    ...전략 필드...,
    "steps": [
      { "order": 1, "title": "현금 확보", "description": "...", "icon": "💰", "phasePct": 0 },
      { "order": 2, "title": "소형 매입", "description": "...", "icon": "🏠", "phasePct": 30 }
    ]
  }
}
```

---

## 8. Chat

### POST /api/chat  *(A/U)*
```
Content-Type: application/json
Accept: text/event-stream

// 요청 body
{
  "message": "디딤돌 대출 조건이 어떻게 돼요?",
  "history": [
    { "role": "user", "content": "이전 질문" },
    { "role": "assistant", "content": "이전 답변" }
  ],
  "context": {
    "page": "/dashboard",
    "userProfile": { "cash": 8000, ... },
    "simConfig": { "ltvRatio": 0.5, ... }
  }
}

// 응답 (SSE 스트림)
data: {"type": "delta", "content": "디딤돌"}
data: {"type": "delta", "content": " 대출은"}
...
data: {"type": "done"}

// 오류 시
data: {"type": "error", "message": "챗봇 서비스에 연결할 수 없습니다."}
```

---

## 에러 코드 표

| 코드 | HTTP | 설명 |
|---|---|---|
| INVALID_INPUT | 400 | 요청 값 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| TOKEN_INVALID | 401 | 잘못된 토큰 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| USER_NOT_FOUND | 404 | 사용자 없음 |
| DUPLICATE_EMAIL | 409 | 이메일 중복 |
| EXTERNAL_API_ERROR | 502 | 외부 API 실패 |
| CHATBOT_ERROR | 502 | 챗봇 연결 실패 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |
