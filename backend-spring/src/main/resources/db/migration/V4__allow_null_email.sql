-- Kakao 비즈앱 미전환 시 account_email scope 없이 로그인 가능하도록
-- email NULL 허용 (MySQL UNIQUE index는 NULL 다중 허용)
ALTER TABLE users
    MODIFY COLUMN email VARCHAR(120) NULL;
