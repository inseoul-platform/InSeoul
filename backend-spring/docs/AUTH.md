# InSeoul 인증 설계

## 1. JWT 토큰 정책

| 항목 | Access Token | Refresh Token |
|---|---|---|
| 만료 | 15분 | 7일 |
| 알고리즘 | HS256 | HS256 |
| 저장 위치 | 클라이언트 메모리 / sessionStorage | DB (refresh_tokens.token_hash) |
| 갱신 정책 | Access 만료 시 Refresh로 재발급 | 회전 (사용할 때마다 새 토큰 발급 + 이전 토큰 revoke) |
| Payload | `{sub: userId, email, role, iat, exp}` | `{sub: userId, iat, exp}` |

**시크릿**: 환경변수 `JWT_SECRET` (최소 256bit, Base64)

---

## 2. 자체 로그인 시퀀스

```
클라이언트                   Spring                       MySQL
   │                          │                              │
   │─POST /api/auth/signup──▶│                              │
   │  {email, password, nick} │──INSERT users + profiles──▶│
   │                          │◀─────────────────────────── │
   │◀──{userId, tokens}───── │                              │
   │                          │                              │
   │─POST /api/auth/login───▶│                              │
   │  {email, password}       │──SELECT users WHERE email──▶│
   │                          │◀─────────────────────────── │
   │                          │  BCrypt.verify(password)     │
   │                          │──INSERT refresh_tokens──────▶│
   │◀──{accessToken,          │                              │
   │    refreshToken, user}── │                              │
```

---

## 3. JWT 인증 필터 (매 요청)

```
요청 헤더: Authorization: Bearer eyJ...
    │
JwtAuthenticationFilter
    │── 토큰 추출 및 파싱 (JwtTokenProvider)
    │── 만료 확인
    │── userId → DB에서 사용자 조회
    │── UsernamePasswordAuthenticationToken 생성
    └── SecurityContextHolder에 저장
```

---

## 4. Refresh Token 갱신

```
POST /api/auth/refresh {refreshToken}
    │
    ├── DB에서 token_hash 조회
    ├── revoked == false 확인
    ├── expires_at 확인
    ├── 이전 토큰 revoked = 1
    ├── 새 access + refresh 토큰 발급
    └── 새 refresh_tokens INSERT
```

**보안**: DB에는 원본 토큰이 아닌 SHA-256 해시만 저장.

---

## 5. OAuth2 흐름 (Kakao / Google)

```
브라우저                    Spring                       Kakao/Google             MySQL
   │                          │                              │                      │
   │─GET /oauth2/{provider}/login─▶│                        │                      │
   │◀─302 redirect──────────── │                            │                      │
   │─────────────────────────────────────────────────────▶ │                      │
   │◀──인증 완료 + code ─────────────────────────────────── │                      │
   │                          │                              │                      │
   │─GET /oauth2/{provider}/callback?code=...─▶│            │                      │
   │                          │──토큰 교환──────────────────▶│                      │
   │                          │◀──access_token ─────────────│                      │
   │                          │──사용자 정보 요청───────────▶│                      │
   │                          │◀──{id, email, name} ─────── │                      │
   │                          │                              │                      │
   │                          │──users UPSERT──────────────────────────────────── ▶│
   │                          │──oauth_accounts UPSERT────────────────────────────▶│
   │                          │◀────────────────────────────────────────────────── │
   │                          │  자체 JWT 발급               │                      │
   │◀─302 redirect──────────── │                            │                      │
   │  http://localhost:5173/#accessToken=...&refreshToken=...                       │
   │                          │                              │                      │
   JS: location.hash에서 토큰 추출 → sessionStorage 이관 → history.replaceState
```

---

## 6. Kakao OAuth2 설정 (`application-local.yml`)

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            client-id: ${KAKAO_CLIENT_ID}
            client-secret: ${KAKAO_CLIENT_SECRET}
            redirect-uri: http://localhost:8080/login/oauth2/code/kakao
            authorization-grant-type: authorization_code
            scope: profile_nickname, account_email
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id
```

Google은 `spring.security.oauth2.client.registration.google`으로 기본 제공자 사용.

---

## 7. SecurityFilterChain 공개/인증 경로

| 경로 패턴 | 접근 |
|---|---|
| /api/auth/** | 모두 허용 |
| /api/health | 모두 허용 |
| /api/districts/** | 모두 허용 |
| /api/loans/products | 모두 허용 |
| /api/strategies/** | 모두 허용 |
| /api/simulation/** | 모두 허용 (비로그인도 가능) |
| /api/chat | 모두 허용 (비로그인도 가능) |
| /swagger-ui/** | 모두 허용 |
| /v3/api-docs/** | 모두 허용 |
| /api/users/me | **인증 필요** |

---

## 8. 보안 설정 요약

- `csrf().disable()` — JWT Stateless
- `sessionCreationPolicy(STATELESS)`
- `BCryptPasswordEncoder(strength=12)`
- CORS 허용: `http://localhost:5173`, `http://localhost:5500`, prod 도메인
- 응답 헤더: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin`
