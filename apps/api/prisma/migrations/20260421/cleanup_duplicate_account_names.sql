-- Migration: Cleanup duplicate account.name (탈퇴 + 활성 패턴)
-- Date: 2026-04-21
-- Feature: account-name-unique (BUGFIX P1) 선행 cleanup
-- Description:
--   2026-04-21 운영 DB 점검에서 발견된 4건 중복(모두 탈퇴 + 활성 패턴) 정리.
--   활성 계정을 그대로 두고, 탈퇴 계정의 name에 __legacy__<id> suffix를 붙여 UNIQUE 충돌 제거.
--   각 사용자는 탈퇴 직후(수십 초~수십 분 내) 같은 ID로 재가입한 케이스이므로 탈퇴 계정 복구 수요 없음.
--
-- 대상 탈퇴 계정:
--   _id=51   agnesy95       (탈퇴 2026-03-17 20:23, 활성 _id=181)
--   _id=214  hyunyoung14    (탈퇴 2026-03-22 13:12, 활성 _id=219)
--   _id=218  anstmdgns2923  (탈퇴 2026-03-22 13:30, 활성 _id=221)
--   _id=244  jcw990531      (탈퇴 2026-03-29 14:13, 활성 _id=245)

-- Apply order: 이 파일 먼저 → account_name_unique.sql

-- Up Migration
UPDATE `account`
SET `name` = CONCAT(`name`, '__legacy__', `_id`)
WHERE `_id` IN (51, 214, 218, 244);

-- Verification (위 UPDATE 직후 0 반환 확인)
-- SELECT LOWER(name) AS lname, COUNT(*) AS cnt
-- FROM account
-- GROUP BY lname
-- HAVING cnt > 1;

-- Down Migration (rollback)
-- UPDATE `account` SET `name` = SUBSTRING_INDEX(`name`, '__legacy__', 1) WHERE `_id` IN (51, 214, 218, 244);

-- Notes:
-- - 해당 4건 탈퇴 계정은 이 cleanup 이후 기존 name으로 restoreAccount 불가 (사용자 재가입 완료 상태로 수요 없음)
-- - hardcoded id 기반 1회성 정리이므로 비멱등: 재실행 시 이중 suffix 부여되므로 적용 1회만 수행
