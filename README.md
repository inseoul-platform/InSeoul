# InSeoul — 데이터로 설계하는 내 집 마련 최단 경로

> **"막막한 서울 내 집 마련, 감이 아닌 데이터로 확신을 드립니다."**

서울 아파트 구매 시뮬레이터. 개인 재무 상태와 시장 변수를 결합하여 **골든 크로스(자산 성장선과 매수 가능가가 교차하는 시점)**를 예측하고 징검다리 전략을 제시합니다.

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Vite + React)  :5173                          │
│  src/services/apiClient  →  JWT Bearer 자동 첨부        │
└─────────┬──────────────────────────────┬────────────────┘
          │ /api/**                       │ /api/chat (SSE)
          ▼                               ▼
┌─────────────────────┐       ┌──────────────────────┐
│  Spring Boot  :8080 │       │  Spring Boot  :8080  │
│  (MyBatis + MySQL)  │──────▶│  ChatRelayService    │
│  JWT / OAuth2       │       │  (WebClient)         │
└─────────┬───────────┘       └──────────┬───────────┘
          │ Flyway                        │ POST /chat
          ▼                               ▼
┌─────────────────────┐       ┌──────────────────────┐
│  MySQL 8  :3306     │       │  FastAPI  :8000       │
│  inseoul DB         │       │  RAG 챗봇 (ChromaDB)  │
└─────────────────────┘       └──────────────────────┘
```

| 서비스 | 기술 | 포트 | 역할 |
|--------|------|------|------|
| **frontend** | Vite + React + Tailwind | 5173 | SPA, 시뮬레이션 UI |
| **backend-spring** | Spring Boot 3.5 / Java 21 / MyBatis | 8080 | REST API, 인증, DB, 국토부 프록시 |
| **backend (FastAPI)** | Python 3.11 / LangChain / ChromaDB | 8000 | RAG 챗봇 SSE |
| **MySQL** | MySQL 8 | 3306 | 영구 데이터 저장 |

---

## 핵심 기능

### 골든 크로스 시뮬레이터
월별 복리 자산 성장 모델과 아파트 가격 예측 모델을 교차하여 매수 가능 시점(D-Day)을 계산합니다.

```
A(t) = 현금 × (1 + r/12)^t + 월저축 × ((1+r/12)^t - 1) / (r/12)
P(t) = 목표가 × (1 + 연간상승률)^(t/12)
필요자본 = P(t) × (1 - LTV) + P(t) × 취득세율
골든크로스: A(t) ≥ 필요자본 을 만족하는 최소 t
```

### 리스크 스트레스 테스트
- 금리 1~2% 상승 시 D-Day 지연 개월 계산
- 주택 가격 10~20% 급등 시 시나리오 분석

### 정책 대출 적격성 판정
보금자리론 / 디딤돌 대출 / 청년 버팀목 전세자금 자동 판정

### AI 어드바이저 (RAG 챗봇)
사용자의 현재 재무 데이터와 페이지 컨텍스트를 포함한 개인화 부동산 조언. ChromaDB + GPT 스트리밍.

---

## 빠른 시작

### 요구사항

| 항목 | 버전 |
|------|------|
| Java | 21 LTS |
| Node.js | 20+ |
| Python | 3.11+ |
| Docker | 20+ |

### 방법 1 — Make (권장)

```bash
# 최초 1회: 환경변수 파일 생성
cp .env.example .env.local       # 프론트 환경변수
cp backend/.env.example backend/.env  # FastAPI 환경변수 (OPENAI_API_KEY 입력)

# 전체 스택 시작 (MySQL → Spring → FastAPI → Vite 순서)
make dev

# 개별 실행
make db       # MySQL Docker 컨테이너만
make spring   # Spring Boot만
make fastapi  # FastAPI만
make frontend # Vite 개발 서버만

# 종료
make stop

# 상태 확인
make status
```

### 방법 2 — Docker Compose (프로덕션)

```bash
# 환경변수 설정
export MYSQL_ROOT_PASSWORD=your_password
export JWT_SECRET=your-256bit-secret
export OPENAI_API_KEY=sk-...
# (선택) KAKAO_CLIENT_ID, GOOGLE_CLIENT_ID 등

# 프론트엔드 빌드
npm install && npm run build

# 전체 스택 기동
docker compose up -d

# 로그 확인
docker compose logs -f spring
```

### 방법 3 — 수동 실행

<details>
<summary>단계별 수동 실행</summary>

**1. MySQL 시작**
```bash
docker run -d --name inseoul-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=inseoul \
  -p 3306:3306 \
  mysql:8.0 --character-set-server=utf8mb4
```

**2. Spring Boot 시작**
```bash
cd backend-spring
./gradlew bootRun --args='--spring.profiles.active=local'
# http://localhost:8080/api/health 확인
# http://localhost:8080/swagger-ui/index.html Swagger UI
```

**3. FastAPI 시작**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # OPENAI_API_KEY 입력
python scripts/ingest.py   # 지식 베이스 인제스트 (최초 1회)
uvicorn main:app --reload --port 8000
```

**4. 프론트엔드 시작**
```bash
# 루트 디렉터리
cp .env.example .env.local  # VITE_API_BASE=http://localhost:8080 설정됨
npm install
npm run dev
# http://localhost:5173
```

</details>

---

## 환경변수

### 프론트엔드 (`.env.local`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE` | `http://localhost:8080` | Spring Boot API 주소 |
| `VITE_KAKAO_MAP_KEY` | — | 카카오 지도 SDK 키 |

### Spring Boot (`application-local.yml` 또는 환경변수)

| 환경변수 | 기본값 | 설명 |
|----------|--------|------|
| `JWT_SECRET` | dev 기본값 | HS256 서명 키 (prod에서 반드시 변경) |
| `MOLIT_API_KEY` | — | 국토부 실거래가 API 키 ([data.go.kr](https://www.data.go.kr) 발급) |
| `KAKAO_CLIENT_ID` | — | Kakao OAuth2 앱 키 |
| `GOOGLE_CLIENT_ID` | — | Google OAuth2 클라이언트 ID |
| `CHATBOT_URL` | `http://127.0.0.1:8000` | FastAPI 챗봇 주소 |

### FastAPI (`.env`)

| 환경변수 | 설명 |
|----------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (필수) |
| `CHROMA_PERSIST_DIR` | ChromaDB 저장 경로 (기본: `./vectorstore`) |

---

## API 엔드포인트

Swagger UI: **`http://localhost:8080/swagger-ui/index.html`**

| 도메인 | 주요 엔드포인트 | 인증 |
|--------|----------------|------|
| **Auth** | `POST /api/auth/signup` `POST /api/auth/login` `POST /api/auth/refresh` `POST /api/auth/logout` | 일부 공개 |
| **OAuth2** | `GET /oauth2/authorization/kakao` `GET /oauth2/authorization/google` | 공개 |
| **User** | `GET /api/users/me` `PUT /api/users/me/profile` `PUT /api/users/me/sim-config` `DELETE /api/users/me` | JWT 필요 |
| **Districts** | `GET /api/districts` `GET /api/districts/prices` `GET /api/districts/{code}/prices` | 공개 |
| **Loans** | `GET /api/loans/products` `POST /api/loans/eligibility` | 공개 |
| **Strategies** | `GET /api/strategies` `GET /api/strategies/{type}` | 공개 |
| **Simulation** | `POST /api/simulation/golden-cross` `POST /api/simulation/stress-test` `POST /api/simulation/chart-data` | 공개 |
| **Chat** | `POST /api/chat` (SSE) | 공개 |
| **Health** | `GET /api/health` | 공개 |

---

## 인증 흐름

```
# 자체 로그인
POST /api/auth/signup  →  { accessToken, refreshToken, user }
POST /api/auth/login   →  { accessToken, refreshToken, user }
POST /api/auth/refresh →  새 토큰 쌍 (refresh 토큰 회전)

# OAuth2 (Kakao/Google)
브라우저 → GET /oauth2/authorization/{provider}
           → provider 동의 화면
           → Spring 콜백 → JWT 발급
           → 프론트 redirect: /#accessToken=...&refreshToken=...

# 인증 필요 요청
Authorization: Bearer {accessToken}
```

- Access Token: 15분 유효 (HS256)
- Refresh Token: 7일 유효, 매 갱신 시 회전

---

## DB 스키마

```
users ─┬─ user_profiles      (재무 프로필)
       ├─ user_sim_configs    (시뮬레이션 설정)
       └─ oauth_accounts      (소셜 계정 연결)

refresh_tokens               (JWT 갱신 토큰, SHA-256 해시 저장)

districts ─── district_price_cache   (국토부 가격 24h 캐시)

loan_products                (정책 대출 카탈로그)
strategies ─── strategy_steps        (투자 전략 및 단계)
```

Flyway 마이그레이션: `backend-spring/src/main/resources/db/migration/`
- `V1__init.sql` — 스키마 10개 테이블
- `V2__seed_districts.sql` — 서울 25개 자치구
- `V3__seed_loans_strategies.sql` — 정책 대출 + 전략 시드

---

## AI 어드바이저 (RAG 챗봇)

FastAPI 기반 RAG 파이프라인이 Spring Boot를 통해 프록시됩니다.

```
사용자 질문
    │
    ▼
Spring /api/chat (SSE 패스스루)
    │
    ▼
FastAPI /chat
    ├─ SentenceTransformer 임베딩 → ChromaDB 코사인 유사도 검색 (top-4)
    ├─ 시스템 프롬프트 구성 (페이지 컨텍스트 + 사용자 재무 데이터 + 히스토리)
    └─ OpenAI GPT 스트리밍 → SSE data: {"type":"delta","content":"..."}
```

**지식 베이스** (`backend/knowledge/`):

| 파일 | 내용 |
|------|------|
| `calculation_logic.md` | D-Day 산출 공식, FV 계산, LTV/DSR |
| `financial_concepts.md` | 금융 개념 설명 |
| `loan_products.md` | 정책 대출 상품 |
| `seoul_districts.md` | 서울 자치구별 시세 |
| `strategies.md` | 징검다리 전략 |

챗봇 히스토리는 localStorage에 저장됩니다 (서버 미저장).

---

## 프로젝트 구조

```
InSeoul/
├── src/                        # Vite + React 프론트엔드
│   ├── pages/                  # 화면 컴포넌트
│   ├── services/               # API 클라이언트
│   │   ├── apiClient.js        # Axios + JWT 인터셉터
│   │   ├── api.js              # 구 가격 데이터 (Spring 프록시)
│   │   └── chatbotService.js   # 챗봇 SSE (Spring 프록시)
│   ├── store/
│   │   └── useAppStore.js      # Zustand 전역 상태 (인증 포함)
│   └── utils/
│       └── calculator.js       # 시뮬레이션 계산 (클라이언트 사이드)
│
├── backend-spring/             # Spring Boot 백엔드
│   ├── src/main/java/com/inseoul/
│   │   ├── auth/               # JWT, OAuth2, 회원가입/로그인
│   │   ├── user/               # 프로필, 시뮬레이션 설정
│   │   ├── district/           # 25개구 + 국토부 프록시
│   │   ├── loan/               # 정책 대출 + 적격성
│   │   ├── strategy/           # 투자 전략
│   │   ├── simulation/         # 골든크로스 계산 엔진
│   │   └── chat/               # FastAPI SSE 중계
│   ├── src/main/resources/
│   │   ├── db/migration/       # Flyway SQL
│   │   └── mappers/            # MyBatis XML
│   ├── docs/                   # API/DB/인증/통합 문서
│   └── Dockerfile
│
├── backend/                    # FastAPI RAG 챗봇
│   ├── api/chat.py
│   ├── rag/                    # 임베딩/검색/프롬프트
│   ├── knowledge/              # 지식 베이스 Markdown
│   └── Dockerfile
│
├── nginx/nginx.conf            # 리버스 프록시 설정
├── docker-compose.yml          # 전체 스택 컨테이너 정의
├── Makefile                    # 개발 편의 명령어
└── .env.example                # 환경변수 템플릿
```

---

## 문서

| 문서 | 경로 |
|------|------|
| API 명세 | `backend-spring/docs/API.md` |
| DB 스키마 | `backend-spring/docs/DATA_MODEL.md` |
| 인증 흐름 | `backend-spring/docs/AUTH.md` |
| 외부 연동 | `backend-spring/docs/INTEGRATION.md` |
| 스프린트 계획 | `backend-spring/docs/SPRINT_PLAN.md` |

---

## Issues / 기여

버그 리포트나 기능 제안은 [Issues](../../issues) 탭을 이용해 주세요.
