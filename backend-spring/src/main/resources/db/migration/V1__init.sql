-- ============================================================
-- InSeoul DB 초기 스키마 (V1)
-- charset: utf8mb4_0900_ai_ci / MySQL 8+
-- ============================================================

-- 사용자 계정
CREATE TABLE users (
    id                BIGINT          NOT NULL AUTO_INCREMENT,
    email             VARCHAR(120)    NOT NULL,
    password_hash     VARCHAR(100)    NULL COMMENT 'OAuth 전용 계정은 NULL',
    provider          ENUM('local','kakao','google') NOT NULL DEFAULT 'local',
    provider_user_id  VARCHAR(100)    NULL,
    nickname          VARCHAR(40)     NOT NULL,
    role              VARCHAR(20)     NOT NULL DEFAULT 'USER',
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email (email),
    UNIQUE KEY uq_provider_user (provider, provider_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 재무 프로필 (1:1 users)
CREATE TABLE user_profiles (
    user_id           BIGINT          NOT NULL,
    cash              INT             NOT NULL DEFAULT 0   COMMENT '보유 현금 (만원)',
    monthly_savings   INT             NOT NULL DEFAULT 0   COMMENT '월 저축액 (만원)',
    target_amount     INT             NOT NULL DEFAULT 0   COMMENT '목표 자산 (만원)',
    age               TINYINT UNSIGNED NOT NULL DEFAULT 30,
    income            INT             NOT NULL DEFAULT 500 COMMENT '월 소득 (만원)',
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 시뮬레이션 설정 (1:1 users)
CREATE TABLE user_sim_configs (
    user_id                 BIGINT          NOT NULL,
    savings_increase_rate   DECIMAL(5,2)    NOT NULL DEFAULT 5.00  COMMENT '연 저축 증가율 (%)',
    investment_return_rate  DECIMAL(5,2)    NOT NULL DEFAULT 8.00  COMMENT '투자 수익률 (%)',
    apartment_annual_rise   DECIMAL(5,2)    NOT NULL DEFAULT 3.00  COMMENT '아파트 연간 상승률 (%)',
    ltv_ratio               DECIMAL(4,3)    NOT NULL DEFAULT 0.500 COMMENT 'LTV 비율',
    acquisition_tax_rate    DECIMAL(5,4)    NOT NULL DEFAULT 0.0350 COMMENT '취득세율',
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_simconfig_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- OAuth2 연동 계정
CREATE TABLE oauth_accounts (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    linked_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_oauth_provider_user (provider, provider_user_id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- JWT Refresh Token
CREATE TABLE refresh_tokens (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    token_hash  CHAR(64)    NOT NULL COMMENT 'SHA-256 해시',
    expires_at  DATETIME    NOT NULL,
    revoked     TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 서울 25개 자치구 (정적 카탈로그)
CREATE TABLE districts (
    code         VARCHAR(5)      NOT NULL COMMENT 'LAWD_CD 법정동코드',
    region       VARCHAR(40)     NOT NULL COMMENT '자치구명',
    lat          DECIMAL(10,7)   NOT NULL,
    lng          DECIMAL(10,7)   NOT NULL,
    tier_default TINYINT         NOT NULL DEFAULT 2 COMMENT '1=진입가능 2=3년내 3=장기목표',
    PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 국토부 실거래가 캐시 (24h TTL)
CREATE TABLE district_price_cache (
    code       VARCHAR(5)  NOT NULL,
    trade_avg  INT         NULL COMMENT '매매 평균가 (만원)',
    rent_avg   INT         NULL COMMENT '전세 평균가 (만원)',
    fetched_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (code),
    INDEX idx_fetched_at (fetched_at),
    CONSTRAINT fk_price_district FOREIGN KEY (code) REFERENCES districts (code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정책 대출 상품 카탈로그 (정적 시드)
CREATE TABLE loan_products (
    prod_key       VARCHAR(40)  NOT NULL,
    name           VARCHAR(80)  NOT NULL,
    type           VARCHAR(30)  NOT NULL COMMENT '예: 구입자금, 전세자금',
    rate_text      VARCHAR(40)  NOT NULL COMMENT '예: 2.45~3.55%',
    loan_limit     BIGINT       NOT NULL COMMENT '한도 (만원)',
    condition_text TEXT         NOT NULL COMMENT '자격 조건 설명',
    raw_json       JSON         NULL     COMMENT '원본 상품 데이터',
    PRIMARY KEY (prod_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 투자 전략 카탈로그 (정적 시드)
CREATE TABLE strategies (
    type             VARCHAR(30)  NOT NULL COMMENT 'relay | downsize',
    badge            VARCHAR(30)  NOT NULL,
    title            VARCHAR(80)  NOT NULL,
    subtitle         TEXT         NOT NULL,
    risk_level       VARCHAR(10)  NOT NULL COMMENT '낮음 | 중간 | 높음',
    risk_badge       VARCHAR(40)  NOT NULL COMMENT 'CSS 클래스',
    accent_gradient  VARCHAR(100) NOT NULL COMMENT 'CSS gradient',
    target_price     BIGINT       NOT NULL COMMENT '목표가 (만원)',
    PRIMARY KEY (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 전략 단계 (N:1 strategies)
CREATE TABLE strategy_steps (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    strategy_type VARCHAR(30) NOT NULL,
    step_order    INT         NOT NULL,
    title         VARCHAR(80) NOT NULL,
    description   TEXT        NOT NULL,
    icon          VARCHAR(40) NOT NULL COMMENT 'emoji 또는 아이콘 코드',
    phase_pct     INT         NOT NULL DEFAULT 0 COMMENT '타임라인 진행률 (%)',
    PRIMARY KEY (id),
    INDEX idx_strategy_order (strategy_type, step_order),
    CONSTRAINT fk_step_strategy FOREIGN KEY (strategy_type) REFERENCES strategies (type) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
