# InSeoul Spring Boot 백엔드 — 스프린트 계획 개요

> **기준일**: 2026-05-15  
> **기술 스택**: Java 21 / Spring Boot 3.5 / MyBatis 3.0.5 / MySQL 8 / Flyway / Gradle

---

## 전체 흐름

```
W1   인프라           Gradle · DB · MyBatis · Swagger · 공통 응답/예외
W2   인증             JWT 자체 로그인 + Kakao/Google OAuth2
W3   User 도메인      프로필 · 시뮬레이션 설정 CRUD
W4   District        25개구 카탈로그 + 국토부 API 프록시 + 캐시
W5   Loan/Strategy   정책대출 · 전략 카탈로그 + calculator.js Java 포팅
W6   Chat SSE        FastAPI 챗봇 SSE 중계
W7   프론트 연동      API 클라이언트 교체 · 로그인 화면
W8   QA & 배포        Docker Compose · Nginx · 배포 준비
W9   README          아키텍처 전면 문서화
W10  자동화           Makefile 개발 편의 명령어
W11  환경변수 통합    .env 단일화 · .env.example 템플릿
W12  CI 파이프라인    GitHub Actions · 유닛 테스트 · API 스모크 테스트
```

---

## 주차별 상태 요약

| 주차 | 테마 | 상태 | 문서 |
|------|------|:----:|------|
| W1 | 부트스트랩 & 인프라 | ✅ 완료 | [sprints/W1.md](sprints/W1.md) |
| W2 | 인증 (JWT + OAuth2) | ✅ 완료 | [sprints/W2.md](sprints/W2.md) |
| W3 | User / Profile / SimConfig | ✅ 완료 | [sprints/W3.md](sprints/W3.md) |
| W4 | District + 국토부 프록시 | ✅ 완료 | [sprints/W4.md](sprints/W4.md) |
| W5 | Loan / Strategy / Simulation | ✅ 완료 | [sprints/W5.md](sprints/W5.md) |
| W6 | Chat SSE 중계 | ✅ 완료 | [sprints/W6.md](sprints/W6.md) |
| W7 | 프론트 API 연동 | ✅ 완료 | [sprints/W7.md](sprints/W7.md) |
| W8 | QA & 배포 준비 | 🔶 진행중 | [sprints/W8.md](sprints/W8.md) |
| W9 | README 업데이트 | ✅ 완료 | [sprints/W9.md](sprints/W9.md) |
| W10 | 개발 자동화 (Makefile) | ✅ 완료 | [sprints/W10.md](sprints/W10.md) |
| W11 | 환경변수 통합 (.env) | ✅ 완료 | [sprints/W11.md](sprints/W11.md) |
| W12 | GitHub Actions CI 파이프라인 | ✅ 완료 | [sprints/W12.md](sprints/W12.md) |

> 🔶 = 코드 완료, 실 API 키 필요한 항목 잔여

---

## 구현된 API 엔드포인트 전체 목록

| 도메인 | Method | Path | 인증 |
|--------|--------|------|:----:|
| **Health** | GET | /api/health | — |
| **Auth** | POST | /api/auth/signup | — |
| | POST | /api/auth/login | — |
| | POST | /api/auth/refresh | — |
| | POST | /api/auth/logout | JWT |
| | GET | /oauth2/authorization/{provider} | — |
| | GET | /api/auth/me | JWT |
| **User** | GET | /api/users/me | JWT |
| | PUT | /api/users/me/profile | JWT |
| | PUT | /api/users/me/sim-config | JWT |
| | DELETE | /api/users/me | JWT |
| **Districts** | GET | /api/districts | — |
| | GET | /api/districts/prices | — |
| | GET | /api/districts/{code}/prices | — |
| **Loans** | GET | /api/loans/products | — |
| | POST | /api/loans/eligibility | — |
| **Strategies** | GET | /api/strategies | — |
| | GET | /api/strategies/{type} | — |
| **Simulation** | POST | /api/simulation/golden-cross | — |
| | POST | /api/simulation/stress-test | — |
| | POST | /api/simulation/chart-data | — |
| **Chat** | POST | /api/chat | — |

---

## DB 마이그레이션

| 파일 | 내용 |
|------|------|
| V1__init.sql | 스키마 10개 테이블 전체 DDL |
| V2__seed_districts.sql | 서울 25개 자치구 (LAWD_CD · 좌표 · tier) |
| V3__seed_loans_strategies.sql | 정책대출 3종 · 전략 2종 · 단계 8건 |

---

## 리스크 / 결정 보류

| 항목 | 현재 결정 | 전환 트리거 |
|------|-----------|------------|
| calculator.js 서버 이관 | 듀얼 모드 (클라 유지 + 서버 보조) | PDF 리포트 도입 시 |
| Redis 도입 | MySQL 캐시 테이블 (W4) | 국토부 호출 10,000회/일 초과 시 |
| WebFlux 전면 전환 | Tomcat + WebClient 부분 사용 | 동시 SSE 100명 이상 시 |
| 챗봇 히스토리 DB 저장 | localStorage 유지 | 사용자 동의 기능 도입 시 |
| 배포 인프라 | 단일 EC2 + Docker Compose | 트래픽 확장 시 ECS/EKS |
