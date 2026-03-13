-- 개인정보 제공동의 일시 필드 추가
ALTER TABLE account ADD COLUMN privacy_agreed_at DATETIME NULL DEFAULT NULL;
