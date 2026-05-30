-- 정책 대출 상품 seed
INSERT INTO loan_products (prod_key, name, type, rate_text, loan_limit, condition_text) VALUES
('bogeumjari', '보금자리론', '고정금리 장기 주택담보대출', '연 3.65~4.00%', 36000,
 '주택가격 9억 원 이하 / 부부합산 소득 7천만 원 이하'),
('didimdul', '디딤돌 대출', '저금리 주택구입자금 대출', '연 2.45~3.55%', 25000,
 '주택가격 5억 원 이하 / 부부합산 소득 6천만 원 이하 (신혼 7천만)'),
('butimok', '청년전용 버팀목 전세자금', '청년 전세보증금 대출', '연 1.5~2.1%', 7000,
 '만 19~34세 / 단독세대주 / 순자산 8,600만 원 이하')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 투자 전략 seed
INSERT INTO strategies (type, badge, title, subtitle, risk_level, risk_badge, accent_gradient, target_price) VALUES
('relay', '추천 대안 1 — 경유 전략', '광명시 철산동 아파트 경유 전략',
 '현재 모인 자금과 월 저축액으로 2년 내에 진입 가능한 현실적인 대안 지역입니다. 이곳에서 실거주하며 자산을 안정적으로 증식한 후 인서울을 노려보는 것을 권장합니다.',
 '낮음', 'bg-emerald-50 text-emerald-600', 'from-sky-400 to-blue-500', 35000),
('downsize', '추천 대안 2 — 평수 하향', '목표 지역 내 평수 하향 조정 전략',
 '원하는 목표 지역(예: 마포구)을 유지하되, 평수를 20평대로 줄여 초기 진입 장벽을 낮추는 전략입니다. 목표 지역 상승세를 그대로 누리면서 자본금을 줄일 수 있는 방법입니다.',
 '중간', 'bg-amber-50 text-amber-600', 'from-violet-400 to-purple-500', 55000)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 전략 단계 seed (relay)
INSERT INTO strategy_steps (strategy_type, step_order, title, description, icon, phase_pct) VALUES
('relay', 1, '자금 확보 및 계획 수립', '현재 거주지 전세금 회수 일정 확인 및 부족분 대출 계획 수립. 광명시 철산동 기준 약 3.5억 예산 확인.', 'account_balance', 0),
('relay', 2, '지역 임장 및 매물 탐색', '철산동 주요 단지 (철산주공 등 20평대) 주말 임장 진행. 역세권 단지 우선 탐색.', 'map', 25),
('relay', 3, '금융 상품 매칭', '보금자리론, 디딤돌 대출 등 정책 대출 상품 한도 및 금리 조건 확인. 최저 금리 상품 우선 검토.', 'credit_card', 60),
('relay', 4, '계약 및 전입신고', '매매계약 체결 후 30일 이내 전입신고 완료. 취득세 신고·납부 진행.', 'fact_check', 90),
-- 전략 단계 seed (downsize)
('downsize', 1, '축소 평형 목표 설정', '20~24평 기준으로 목표 지역 내 매물 가격 재조사. 마포구 20평대 기준 약 5.5억 내외 확인.', 'straighten', 0),
('downsize', 2, '추가 자금 마련 계획 수립', '부족한 자본금 충당을 위한 재형저축, ETF 적립식 투자 병행 계획 수립.', 'savings', 25),
('downsize', 3, '금융 상품 매칭', '보금자리론 (공시가 9억 이하 조건 확인), 디딤돌 대출 (미혼·신혼부부 조건 확인) 검토.', 'credit_card', 60),
('downsize', 4, '목표 지역 임장 및 계약', '역세권·학군 우선 매물 탐색. 계약 전 등기부등본, 건축물대장 필수 확인.', 'fact_check', 90)
ON DUPLICATE KEY UPDATE title = VALUES(title);
