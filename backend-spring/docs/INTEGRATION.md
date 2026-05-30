# InSeoul 외부 통합 설계

## 1. FastAPI 챗봇 SSE 중계

### 아키텍처
```
클라이언트                Spring (8080)                FastAPI (8000)
    │                         │                              │
    │─POST /api/chat─────────▶│                             │
    │  {message,history,ctx}  │─POST /chat (WebClient)─────▶│
    │                         │◀──SSE 청크 스트림 ───────── │
    │◀─SSE 청크 (SseEmitter)─ │                              │
    │                         │                              │
    │◀─data: {"type":"done"}─ │◀──data: {"type":"done"}──── │
```

### Spring 구현 패턴

```java
// ChatController.java
@PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter chat(@RequestBody ChatRequest request) {
    SseEmitter emitter = new SseEmitter(5 * 60 * 1000L); // 5분 timeout
    asyncTaskExecutor.execute(() -> chatRelayService.relay(request, emitter));
    return emitter;
}

// ChatRelayService.java
public void relay(ChatRequest request, SseEmitter emitter) {
    webClient.post()
        .uri(fastapiUrl + "/chat")
        .bodyValue(request)
        .retrieve()
        .bodyToFlux(String.class)
        .subscribe(
            chunk -> emitter.send(SseEmitter.event().data(chunk)),
            error -> {
                emitter.send(SseEmitter.event().data("{\"type\":\"error\",\"message\":\"챗봇 연결 실패\"}"));
                emitter.complete();
            },
            emitter::complete
        );
}
```

### 응답 헤더
```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no   ← Nginx 버퍼링 비활성화 (SSE 필수)
```

### FastAPI 설정 (변경 없음)
- URL: `http://127.0.0.1:8000` (환경변수 `FASTAPI_URL`)
- Spring → FastAPI 로 전달하는 body 스키마는 현재와 동일

---

## 2. 국토부 실거래가 API 프록시

### 아키텍처
```
클라이언트            Spring                  국토부 API              MySQL
    │                   │                         │                      │
    │─GET /api/         │                         │                      │
    │  districts/prices─▶│                        │                      │
    │                   │──SELECT district_price_cache──────────────────▶│
    │                   │◀──캐시 있음 (24h 이내) ──────────────────────── │
    │◀──캐시 응답────── │                         │                      │
    │                   │  (캐시 없거나 만료 시)  │                      │
    │                   │─GET 국토부 XML API──────▶│                      │
    │                   │◀──XML 응답 ─────────────│                      │
    │                   │  XmlMapper 파싱         │                      │
    │                   │──UPSERT district_price_cache──────────────────▶│
    │◀──응답────────── │                         │                      │
```

### 국토부 API 호출 스펙
```
GET https://apis.data.go.kr/...?serviceKey={KEY}&LAWD_CD={code}&DEAL_YMD={yyyyMM}&numOfRows=2000
응답: XML (item 배열, dealAmount 필드)
```

### 캐시 정책
| 조건 | 동작 |
|---|---|
| `fetched_at` 이내 (24h) | DB에서 즉시 반환 |
| `fetched_at` 초과 | 비동기 갱신 후 기존 캐시 반환 (stale-while-revalidate) |
| `?refresh=true` 쿼리 | 동기 강제 갱신 |
| `@Scheduled` 04:00 | 25개구 전체 일괄 갱신 |

### Resilience4j 설정
```yaml
resilience4j:
  ratelimiter:
    instances:
      molit:
        limit-for-period: 30
        limit-refresh-period: 1m
        timeout-duration: 5s
  retry:
    instances:
      molit:
        max-attempts: 3
        wait-duration: 500ms
```

---

## 3. Kakao Maps (클라이언트 전용)

Spring은 관여하지 않음. 프론트가 직접 SDK를 로드.

```html
<!-- index.html — 변경 없음 -->
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=%VITE_KAKAO_MAP_KEY%"></script>
```

향후 API 키 노출이 문제가 되면 `GET /api/config/maps` 엔드포인트를 추가해 인증된 사용자에게만 키 전달하는 방식으로 전환 가능.

---

## 4. 환경변수 목록

### Spring 백엔드 (`backend-spring/.env` 또는 시스템 환경변수)
| 변수 | 예시 | 설명 |
|---|---|---|
| `DB_URL` | jdbc:mysql://... | 운영 DB URL |
| `DB_USERNAME` | inseoul | DB 사용자 |
| `DB_PASSWORD` | secret | DB 패스워드 |
| `JWT_SECRET` | base64:abc... | JWT 서명 시크릿 |
| `MOLIT_API_KEY` | abcde123 | 국토부 API 인증키 |
| `FASTAPI_URL` | http://127.0.0.1:8000 | FastAPI 서버 URL |
| `KAKAO_CLIENT_ID` | abc123 | Kakao OAuth2 클라이언트 ID |
| `KAKAO_CLIENT_SECRET` | secret | Kakao OAuth2 시크릿 |
| `GOOGLE_CLIENT_ID` | xxx.apps.googleusercontent.com | Google OAuth2 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | secret | Google OAuth2 시크릿 |

### 프론트엔드 (기존 → W7 교체 후)
| 변수 | 이전 | 이후 (W7) |
|---|---|---|
| `VITE_API_BASE` | (없음) | `http://localhost:8080` |
| `VITE_MOLIT_API_KEY` | 사용 | 삭제 (Spring이 보유) |
| `VITE_MOLIT_API_BASE` | 사용 | 삭제 |
| `VITE_CHATBOT_API_URL` | http://127.0.0.1:8000 | 삭제 (Spring 경유) |
| `VITE_KAKAO_MAP_KEY` | 사용 | 유지 (지도 SDK는 클라이언트) |
