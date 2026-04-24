-- Migration: Add privacy_policy_version column to account
-- Date: 2026-04-24
-- Feature: privacy-consent re-agreement (student-extra-fields 확대 대응)
-- Description:
--   개인정보 수집 항목 확대(보호자 연락처 추가)에 따라 소급 재동의 장치 도입.
--   - Account.privacy_policy_version INT NOT NULL DEFAULT 1
--   - 기존 회원은 자동으로 버전 1 유지 → 다음 로그인 시 /consent 재노출
--   - 신규 가입 및 재동의 시 서버 상수 CURRENT_PRIVACY_VERSION (현재 2)로 업데이트
--   - SMS/카톡/이메일 알림 인프라 부재 상황에서 유일한 공식 재고지 경로

-- Up Migration
ALTER TABLE `account`
    ADD COLUMN `privacy_policy_version` INT NOT NULL DEFAULT 1 AFTER `privacy_agreed_at`;

-- Down Migration (rollback)
-- ALTER TABLE `account` DROP COLUMN `privacy_policy_version`;

-- Notes:
-- - 무중단 ALTER (DEFAULT 1로 기존 레코드 자동 채움)
-- - 259개 기존 계정은 이 마이그레이션 후 모두 version=1로 표시되며, 다음 로그인 시 /consent로 강제 리다이렉트됨
-- - CURRENT_PRIVACY_VERSION은 `packages/shared/src/constants.ts`에서 관리 (현재 2)
-- - 향후 수집 항목 변경 시 CURRENT_PRIVACY_VERSION++ 로 재동의 트리거
