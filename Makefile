# ============================================================
#  InSeoul — 개발 자동화 Makefile
#
#  사용법:
#    make help      이 도움말
#    make dev       전체 스택 시작 (MySQL → Spring → FastAPI → Vite)
#    make stop      전체 스택 종료
#    make status    각 서비스 실행 상태 확인
# ============================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ── 경로 ─────────────────────────────────────────────────────
ROOT_DIR   := $(shell pwd)
SPRING_DIR := $(ROOT_DIR)/backend-spring
FASTAPI_DIR := $(ROOT_DIR)/backend

# ── PID 파일 ─────────────────────────────────────────────────
SPRING_PID  := /tmp/inseoul-spring.pid
FASTAPI_PID := /tmp/inseoul-fastapi.pid
VITE_PID    := /tmp/inseoul-vite.pid

# ── 로그 파일 ────────────────────────────────────────────────
SPRING_LOG  := /tmp/inseoul-spring.log
FASTAPI_LOG := /tmp/inseoul-fastapi.log
VITE_LOG    := /tmp/inseoul-vite.log

# ── DB 설정 ──────────────────────────────────────────────────
DB_CONTAINER := inseoul-mysql
DB_NAME      := inseoul
DB_USER      := $(or $(shell grep -E '^DB_USERNAME=' .env 2>/dev/null | cut -d= -f2- | tr -d "'\""),root)
DB_PASS      := $(or $(shell grep -E '^DB_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d "'\""),root)
DB_PORT      := 3306

# ── 색상 출력 ────────────────────────────────────────────────
BOLD   := $(shell printf '\033[1m')
GREEN  := $(shell printf '\033[32m')
YELLOW := $(shell printf '\033[33m')
CYAN   := $(shell printf '\033[36m')
RED    := $(shell printf '\033[31m')
RESET  := $(shell printf '\033[0m')

.PHONY: help dev stop status \
        db db-stop db-status db-shell \
        spring spring-stop spring-log spring-restart \
        fastapi fastapi-stop fastapi-log \
        frontend frontend-stop \
        build build-spring build-frontend \
        docker-up docker-down docker-logs \
        migrate seed logs clean

# ── 도움말 ───────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(BOLD)$(CYAN)InSeoul 개발 명령어$(RESET)"
	@echo ""
	@echo "$(BOLD)전체 스택$(RESET)"
	@echo "  $(GREEN)make dev$(RESET)         전체 서비스 시작 (MySQL → Spring → FastAPI → Vite)"
	@echo "  $(GREEN)make stop$(RESET)        전체 서비스 종료"
	@echo "  $(GREEN)make status$(RESET)      각 서비스 실행 상태 확인"
	@echo "  $(GREEN)make logs$(RESET)        Spring + FastAPI + Vite 로그 (tail -f)"
	@echo ""
	@echo "$(BOLD)개별 서비스$(RESET)"
	@echo "  $(GREEN)make db$(RESET)          MySQL Docker 컨테이너 시작"
	@echo "  $(GREEN)make db-stop$(RESET)     MySQL 컨테이너 중지"
	@echo "  $(GREEN)make db-shell$(RESET)    MySQL CLI 접속"
	@echo "  $(GREEN)make spring$(RESET)      Spring Boot 시작 (백그라운드)"
	@echo "  $(GREEN)make spring-stop$(RESET) Spring Boot 종료"
	@echo "  $(GREEN)make spring-log$(RESET)  Spring Boot 로그 (tail -f)"
	@echo "  $(GREEN)make fastapi$(RESET)     FastAPI 시작 (백그라운드)"
	@echo "  $(GREEN)make fastapi-stop$(RESET)FastAPI 종료"
	@echo "  $(GREEN)make frontend$(RESET)    Vite 개발 서버 시작"
	@echo "  $(GREEN)make frontend-stop$(RESET)Vite 종료"
	@echo ""
	@echo "$(BOLD)빌드$(RESET)"
	@echo "  $(GREEN)make build$(RESET)       프론트엔드 + Spring Boot 전체 빌드"
	@echo "  $(GREEN)make build-spring$(RESET)Spring Boot JAR 빌드"
	@echo "  $(GREEN)make build-frontend$(RESET)프론트엔드 dist 빌드"
	@echo ""
	@echo "$(BOLD)Docker Compose (프로덕션)$(RESET)"
	@echo "  $(GREEN)make docker-up$(RESET)   docker compose up -d"
	@echo "  $(GREEN)make docker-down$(RESET) docker compose down"
	@echo "  $(GREEN)make docker-logs$(RESET) docker compose logs -f"
	@echo ""
	@echo "$(BOLD)DB 유틸$(RESET)"
	@echo "  $(GREEN)make migrate$(RESET)     Flyway 마이그레이션 상태 확인"
	@echo "  $(GREEN)make seed$(RESET)        DB 시드 데이터 확인 (districts/loans/strategies)"
	@echo ""
	@echo "$(BOLD)기타$(RESET)"
	@echo "  $(GREEN)make clean$(RESET)       빌드 산출물 + PID/로그 파일 정리"
	@echo ""

# ════════════════════════════════════════════════════════════
#  전체 스택
# ════════════════════════════════════════════════════════════

dev: db _wait-db spring _wait-spring fastapi frontend
	@echo ""
	@echo "$(BOLD)$(GREEN)✅  전체 스택 시작 완료$(RESET)"
	@echo ""
	@echo "  Frontend  : $(CYAN)http://localhost:5173$(RESET)"
	@echo "  Spring API: $(CYAN)http://localhost:8080/api/health$(RESET)"
	@echo "  Swagger   : $(CYAN)http://localhost:8080/swagger-ui/index.html$(RESET)"
	@echo "  FastAPI   : $(CYAN)http://localhost:8000/docs$(RESET)"
	@echo ""
	@echo "  종료하려면: $(YELLOW)make stop$(RESET)"
	@echo ""

stop: spring-stop fastapi-stop frontend-stop
	@echo "$(GREEN)✅  모든 서비스 종료$(RESET)"

status:
	@echo ""
	@echo "$(BOLD)서비스 상태$(RESET)"
	@echo "──────────────────────────────────────────"
	@_check_service() { \
		local name=$$1 url=$$2 pid_file=$$3; \
		local pid=""; \
		[ -f "$$pid_file" ] && pid=$$(cat $$pid_file 2>/dev/null); \
		if [ -n "$$pid" ] && kill -0 $$pid 2>/dev/null; then \
			if curl -s --max-time 2 "$$url" > /dev/null 2>&1; then \
				printf "  $(GREEN)●$(RESET) %-12s $(GREEN)UP$(RESET)  (PID $$pid)\n" "$$name"; \
			else \
				printf "  $(YELLOW)●$(RESET) %-12s $(YELLOW)STARTING$(RESET)  (PID $$pid)\n" "$$name"; \
			fi; \
		else \
			printf "  $(RED)○$(RESET) %-12s $(RED)DOWN$(RESET)\n" "$$name"; \
		fi; \
	}; \
	_check_db() { \
		if docker ps --filter name=$(DB_CONTAINER) --filter status=running -q 2>/dev/null | grep -q .; then \
			printf "  $(GREEN)●$(RESET) %-12s $(GREEN)UP$(RESET)  (Docker)\n" "MySQL"; \
		else \
			printf "  $(RED)○$(RESET) %-12s $(RED)DOWN$(RESET)\n" "MySQL"; \
		fi; \
	}; \
	_check_db; \
	_check_service "Spring" "http://localhost:8080/api/health" "$(SPRING_PID)"; \
	_check_service "FastAPI" "http://localhost:8000/docs" "$(FASTAPI_PID)"; \
	_check_service "Vite" "http://localhost:5173" "$(VITE_PID)"
	@echo ""

logs:
	@echo "$(YELLOW)Spring / FastAPI / Vite 로그 (Ctrl-C로 종료)$(RESET)"
	@tail -f $(SPRING_LOG) $(FASTAPI_LOG) $(VITE_LOG) 2>/dev/null || \
		echo "$(RED)로그 파일 없음 — 서비스가 실행 중인지 확인하세요$(RESET)"

# ════════════════════════════════════════════════════════════
#  MySQL
# ════════════════════════════════════════════════════════════

db:
	@if docker ps --filter name=$(DB_CONTAINER) --filter status=running -q 2>/dev/null | grep -q .; then \
		echo "$(GREEN)● MySQL 이미 실행 중$(RESET)"; \
	elif docker ps -a --filter name=$(DB_CONTAINER) -q 2>/dev/null | grep -q .; then \
		echo "$(YELLOW)▶ MySQL 컨테이너 재시작$(RESET)"; \
		docker start $(DB_CONTAINER); \
	else \
		echo "$(YELLOW)▶ MySQL 컨테이너 생성 및 시작$(RESET)"; \
		docker run -d \
			--name $(DB_CONTAINER) \
			-e MYSQL_ROOT_PASSWORD=$(DB_PASS) \
			-e MYSQL_DATABASE=$(DB_NAME) \
			-p $(DB_PORT):3306 \
			mysql:8.0 \
			--character-set-server=utf8mb4 \
			--collation-server=utf8mb4_0900_ai_ci; \
	fi

db-stop:
	@if docker ps --filter name=$(DB_CONTAINER) -q 2>/dev/null | grep -q .; then \
		echo "$(YELLOW)■ MySQL 컨테이너 중지$(RESET)"; \
		docker stop $(DB_CONTAINER); \
	else \
		echo "$(RED)MySQL 컨테이너가 실행 중이 아닙니다$(RESET)"; \
	fi

db-status:
	@docker ps --filter name=$(DB_CONTAINER) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null

db-shell:
	@echo "$(CYAN)MySQL CLI 접속 (DB: $(DB_NAME))$(RESET)"
	@docker exec -it $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASS) $(DB_NAME)

# ── DB 기동 대기 (내부 사용) ────────────────────────────────
_wait-db:
	@echo -n "$(YELLOW)MySQL 기동 대기$(RESET)"
	@for i in $$(seq 1 30); do \
		if docker exec $(DB_CONTAINER) mysqladmin ping -h localhost -u$(DB_USER) -p$(DB_PASS) --silent 2>/dev/null; then \
			echo " $(GREEN)OK$(RESET)"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 1; \
		if [ $$i -eq 30 ]; then echo " $(RED)타임아웃$(RESET)"; exit 1; fi; \
	done

# ════════════════════════════════════════════════════════════
#  Spring Boot
# ════════════════════════════════════════════════════════════

spring:
	@if [ -f $(SPRING_PID) ] && kill -0 $$(cat $(SPRING_PID)) 2>/dev/null; then \
		echo "$(GREEN)● Spring Boot 이미 실행 중 (PID $$(cat $(SPRING_PID)))$(RESET)"; \
	else \
		echo "$(YELLOW)▶ Spring Boot 시작 (백그라운드)$(RESET)"; \
		if [ ! -f "$(ROOT_DIR)/.env" ]; then \
			echo "$(YELLOW)⚠  .env 파일 없음 — 기본값으로 실행 (cp .env.example .env 후 키를 입력하면 전체 기능 사용 가능)$(RESET)"; \
		fi; \
		set -a; [ -f "$(ROOT_DIR)/.env" ] && . "$(ROOT_DIR)/.env" || true; set +a; \
		cd $(SPRING_DIR) && \
		SPRING_PROFILES_ACTIVE=local ./gradlew bootRun --no-daemon \
			-Dspring.profiles.active=local \
			> $(SPRING_LOG) 2>&1 & \
		echo $$! > $(SPRING_PID); \
		echo "  PID $$(cat $(SPRING_PID)) | 로그: $(SPRING_LOG)"; \
	fi

spring-stop:
	@if [ -f $(SPRING_PID) ] && kill -0 $$(cat $(SPRING_PID)) 2>/dev/null; then \
		echo "$(YELLOW)■ Spring Boot 종료 (PID $$(cat $(SPRING_PID)))$(RESET)"; \
		kill $$(cat $(SPRING_PID)) 2>/dev/null; \
		rm -f $(SPRING_PID); \
	else \
		echo "$(RED)Spring Boot 프로세스 없음$(RESET)"; \
		rm -f $(SPRING_PID); \
	fi

spring-log:
	@[ -f $(SPRING_LOG) ] && tail -f $(SPRING_LOG) || echo "$(RED)로그 파일 없음$(RESET)"

spring-restart: spring-stop
	@sleep 2
	@$(MAKE) spring

# ── Spring 기동 대기 (내부 사용) ────────────────────────────
_wait-spring:
	@echo -n "$(YELLOW)Spring Boot 기동 대기$(RESET)"
	@for i in $$(seq 1 60); do \
		if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then \
			echo " $(GREEN)OK$(RESET)"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 2; \
		if [ $$i -eq 60 ]; then echo " $(RED)타임아웃 — 로그 확인: make spring-log$(RESET)"; exit 1; fi; \
	done

# ════════════════════════════════════════════════════════════
#  FastAPI
# ════════════════════════════════════════════════════════════

fastapi:
	@if [ -f $(FASTAPI_PID) ] && kill -0 $$(cat $(FASTAPI_PID)) 2>/dev/null; then \
		echo "$(GREEN)● FastAPI 이미 실행 중 (PID $$(cat $(FASTAPI_PID)))$(RESET)"; \
	else \
		echo "$(YELLOW)▶ FastAPI 시작 (백그라운드)$(RESET)"; \
		if [ ! -f "$(ROOT_DIR)/.env" ]; then \
			echo "$(RED)⚠  .env 파일이 없습니다. cp .env.example .env 후 OPENAI_API_KEY를 입력하세요.$(RESET)"; \
		elif ! grep -q '^OPENAI_API_KEY=.\+' "$(ROOT_DIR)/.env" 2>/dev/null; then \
			echo "$(YELLOW)⚠  OPENAI_API_KEY 미설정 — 챗봇 응답이 비활성화됩니다.$(RESET)"; \
		fi; \
		set -a; [ -f "$(ROOT_DIR)/.env" ] && . "$(ROOT_DIR)/.env" || true; set +a; \
		if [ ! -d $(FASTAPI_DIR)/vectorstore ]; then \
			echo "$(YELLOW)  지식 베이스 인제스트 시작 (최초 1회)...$(RESET)"; \
			cd $(FASTAPI_DIR) && python scripts/ingest.py 2>&1 | tee -a $(FASTAPI_LOG) || true; \
		fi; \
		cd $(FASTAPI_DIR) && \
		uvicorn main:app --host 127.0.0.1 --port 8000 \
			> $(FASTAPI_LOG) 2>&1 & \
		echo $$! > $(FASTAPI_PID); \
		echo "  PID $$(cat $(FASTAPI_PID)) | 로그: $(FASTAPI_LOG)"; \
	fi

fastapi-stop:
	@if [ -f $(FASTAPI_PID) ] && kill -0 $$(cat $(FASTAPI_PID)) 2>/dev/null; then \
		echo "$(YELLOW)■ FastAPI 종료 (PID $$(cat $(FASTAPI_PID)))$(RESET)"; \
		kill $$(cat $(FASTAPI_PID)) 2>/dev/null; \
		rm -f $(FASTAPI_PID); \
	else \
		echo "$(RED)FastAPI 프로세스 없음$(RESET)"; \
		rm -f $(FASTAPI_PID); \
	fi

fastapi-log:
	@[ -f $(FASTAPI_LOG) ] && tail -f $(FASTAPI_LOG) || echo "$(RED)로그 파일 없음$(RESET)"

# ════════════════════════════════════════════════════════════
#  Vite 프론트엔드
# ════════════════════════════════════════════════════════════

frontend:
	@if [ -f $(VITE_PID) ] && kill -0 $$(cat $(VITE_PID)) 2>/dev/null; then \
		echo "$(GREEN)● Vite 이미 실행 중 (PID $$(cat $(VITE_PID)))$(RESET)"; \
	else \
		echo "$(YELLOW)▶ Vite 개발 서버 시작 (백그라운드)$(RESET)"; \
		if [ ! -d node_modules ]; then \
			echo "$(YELLOW)  npm install 실행 중...$(RESET)"; \
			npm install --silent; \
		fi; \
		npm run dev > $(VITE_LOG) 2>&1 & \
		echo $$! > $(VITE_PID); \
		echo "  PID $$(cat $(VITE_PID)) | 로그: $(VITE_LOG)"; \
		echo "  $(CYAN)http://localhost:5173$(RESET)"; \
	fi

frontend-stop:
	@if [ -f $(VITE_PID) ] && kill -0 $$(cat $(VITE_PID)) 2>/dev/null; then \
		echo "$(YELLOW)■ Vite 종료 (PID $$(cat $(VITE_PID)))$(RESET)"; \
		kill $$(cat $(VITE_PID)) 2>/dev/null; \
		rm -f $(VITE_PID); \
	else \
		echo "$(RED)Vite 프로세스 없음$(RESET)"; \
		rm -f $(VITE_PID); \
	fi

# ════════════════════════════════════════════════════════════
#  빌드
# ════════════════════════════════════════════════════════════

build: build-frontend build-spring
	@echo "$(GREEN)✅  빌드 완료$(RESET)"
	@echo "  Spring JAR: $(SPRING_DIR)/build/libs/"
	@echo "  Frontend  : $(ROOT_DIR)/dist/"

build-spring:
	@echo "$(YELLOW)▶ Spring Boot JAR 빌드$(RESET)"
	@cd $(SPRING_DIR) && ./gradlew bootJar -x test --no-daemon
	@echo "$(GREEN)✅  Spring JAR 빌드 완료$(RESET)"
	@ls -lh $(SPRING_DIR)/build/libs/*.jar 2>/dev/null

build-frontend:
	@echo "$(YELLOW)▶ 프론트엔드 빌드$(RESET)"
	@[ ! -d node_modules ] && npm install --silent || true
	@npm run build
	@echo "$(GREEN)✅  프론트엔드 빌드 완료$(RESET)"

# ════════════════════════════════════════════════════════════
#  Docker Compose (프로덕션)
# ════════════════════════════════════════════════════════════

docker-up: build
	@echo "$(YELLOW)▶ Docker Compose 전체 스택 시작$(RESET)"
	@docker compose up -d
	@echo "$(GREEN)✅  Docker Compose 시작$(RESET)"
	@docker compose ps

docker-down:
	@echo "$(YELLOW)■ Docker Compose 종료$(RESET)"
	@docker compose down

docker-logs:
	@docker compose logs -f

# ════════════════════════════════════════════════════════════
#  DB 유틸
# ════════════════════════════════════════════════════════════

migrate:
	@echo "$(CYAN)Flyway 마이그레이션 상태$(RESET)"
	@docker exec $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASS) $(DB_NAME) \
		-e "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;" \
		2>/dev/null || echo "$(RED)DB에 연결할 수 없습니다. make db 먼저 실행하세요.$(RESET)"

seed:
	@echo "$(CYAN)DB 시드 데이터 확인$(RESET)"
	@docker exec $(DB_CONTAINER) mysql -u$(DB_USER) -p$(DB_PASS) $(DB_NAME) 2>/dev/null -e " \
		SELECT 'districts' as tbl, COUNT(*) as cnt FROM districts UNION ALL \
		SELECT 'loan_products', COUNT(*) FROM loan_products UNION ALL \
		SELECT 'strategies', COUNT(*) FROM strategies UNION ALL \
		SELECT 'strategy_steps', COUNT(*) FROM strategy_steps;" \
		2>/dev/null || echo "$(RED)DB에 연결할 수 없습니다.$(RESET)"

# ════════════════════════════════════════════════════════════
#  정리
# ════════════════════════════════════════════════════════════

clean:
	@echo "$(YELLOW)▶ 빌드 산출물 정리$(RESET)"
	@cd $(SPRING_DIR) && ./gradlew clean --no-daemon -q 2>/dev/null || true
	@rm -rf $(ROOT_DIR)/dist
	@rm -f $(SPRING_PID) $(FASTAPI_PID) $(VITE_PID)
	@rm -f $(SPRING_LOG) $(FASTAPI_LOG) $(VITE_LOG)
	@echo "$(GREEN)✅  정리 완료$(RESET)"
