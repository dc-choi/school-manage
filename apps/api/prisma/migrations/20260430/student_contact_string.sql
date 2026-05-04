-- Migration: Convert Student.contact + StudentSnapshot.contact from BIGINT to VARCHAR(20)
-- Date: 2026-04-30
-- Feature: student-contact-string-migration (BUGFIX P3)
-- Description: BIGINT 저장 시 선행 0이 잘리는 버그 해소. 사용자 입력 원본을 그대로 보존하기 위해 VARCHAR(20)로 이관한다. parentContact(이미 VARCHAR(20))와 타입 일관성 확보.

-- ────────────────────────────────────────────────────────────────────
-- Pre-flight (운영 적용 전 반드시 실행)
-- ────────────────────────────────────────────────────────────────────
--
-- BACKUP REQUIRED — 무롤백 전제 (선행 0 손실은 비가역). 백업 없이 적용 금지.
--   $ mysqldump -u <user> -p school_back student student_snapshot \
--       > backup_student_contact_$(date +%Y%m%d_%H%M%S).sql
--
-- Pre-check SQL (read-only, 결과는 화면에만 — 파일/로그 저장 시 PII 노출 주의):
--   -- 1) student.contact 길이 분포
--   SELECT LENGTH(CAST(contact AS CHAR)) AS len, COUNT(*) AS cnt
--   FROM student WHERE contact IS NOT NULL GROUP BY len ORDER BY len;
--
--   -- 2) student_snapshot.contact 길이 분포
--   SELECT LENGTH(CAST(contact AS CHAR)) AS len, COUNT(*) AS cnt
--   FROM student_snapshot WHERE contact IS NOT NULL GROUP BY len ORDER BY len;
--
--   -- 3) 변환 정책에 매칭되지 않을 비정상 row 샘플 (LIMIT 5, PII 노출 최소화)
--   --    11자리 외 + 휴대폰/지역번호 prefix 미일치 케이스
--   SELECT contact FROM student
--   WHERE contact IS NOT NULL
--     AND CHAR_LENGTH(CAST(contact AS CHAR)) NOT IN (11)
--     AND NOT (CHAR_LENGTH(CAST(contact AS CHAR)) = 10 AND CAST(contact AS CHAR) REGEXP '^1[0-9]')
--     AND NOT (CHAR_LENGTH(CAST(contact AS CHAR)) IN (9, 10) AND CAST(contact AS CHAR) REGEXP '^[2-6]')
--     AND NOT (CHAR_LENGTH(CAST(contact AS CHAR)) = 8 AND CAST(contact AS CHAR) REGEXP '^2')
--   LIMIT 5;
--
--   -- 4) 사전 row 카운트 (Step 후 재검증과 비교)
--   SELECT
--     (SELECT COUNT(*) FROM student WHERE contact IS NOT NULL) AS s_with_contact,
--     (SELECT COUNT(*) FROM student WHERE contact IS NULL)     AS s_null,
--     (SELECT COUNT(*) FROM student_snapshot WHERE contact IS NOT NULL) AS sn_with_contact,
--     (SELECT COUNT(*) FROM student_snapshot WHERE contact IS NULL)     AS sn_null;
--
-- 정책: 휴대폰 + 한국 지역번호 prefix 잘림을 복원, 그 외는 NULL 처리(데이터 손실 방어).
--   - 11자리: 그대로 (사실상 발생 불가, 안전장치)
--   - 10자리 + ^1[0-9]: '0' prefix → 휴대폰 010/011/016~019
--   - 10자리 + ^[3-6][0-9]: '0' prefix → 지역번호 031/041/051/061 등 9자리 BigInt가 10자리로 보일 일은 없으나 방어
--   - 9자리 + ^[2-6]: '0' prefix → 02/03x/04x/05x/06x 지역번호 (8자리 본번 + 1자리 prefix 잘림)
--   - 8자리 + ^2: '0' prefix → 02 + 7자리 (구 서울 번호)
--   - 그 외: NULL (비정상 데이터, 운영자 수동 보정 후 재시도 권장)
--
-- 사전 점검 SQL #3 결과가 0건이 아니면 정책 검토 + 수동 보정 후 적용. 0건이면 본 SQL 그대로 적용.

-- ────────────────────────────────────────────────────────────────────
-- Up Migration
-- ────────────────────────────────────────────────────────────────────
-- MySQL DDL은 implicit commit이라 student + student_snapshot을 단일 트랜잭션으로 묶을 수 없다.
-- 운영 절차:
--   1. Step 1 실행 → 검증 SQL `SELECT COUNT(*) FROM student WHERE contact IS NOT NULL` 결과가 사전 카운트와 일치하는지 확인
--   2. 일치하면 Step 2 실행
--   3. Step 2 실패 시 즉시 백업 복원 (student/student_snapshot 둘 다 — 부분 적용 상태 방지)

-- Step 1: student
ALTER TABLE `student` ADD COLUMN `contact_str` VARCHAR(20) NULL;

UPDATE `student` SET `contact_str` = CASE
    WHEN `contact` IS NULL THEN NULL
    -- 11자리: 그대로 (사실상 발생 불가, 안전장치)
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 11
        THEN CAST(`contact` AS CHAR)
    -- 10자리 휴대폰: 010/011/016~019
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 10
         AND CAST(`contact` AS CHAR) REGEXP '^1[0-9]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    -- 10자리 지역번호 (3X~6X 시작) — 사실상 9자리 BigInt 케이스 방어
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 10
         AND CAST(`contact` AS CHAR) REGEXP '^[3-6][0-9]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    -- 9자리 지역번호: 02/03x/04x/05x/06x (8자리 본번)
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 9
         AND CAST(`contact` AS CHAR) REGEXP '^[2-6]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    -- 8자리 02 (구 서울 번호 7자리)
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 8
         AND CAST(`contact` AS CHAR) REGEXP '^2'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    -- 그 외(12자리 이상, 7자리 이하 등): NULL — 운영자 수동 보정 대상
    ELSE NULL
END;

ALTER TABLE `student` DROP COLUMN `contact`;
ALTER TABLE `student` CHANGE COLUMN `contact_str` `contact` VARCHAR(20) NULL;

-- Step 2: student_snapshot
ALTER TABLE `student_snapshot` ADD COLUMN `contact_str` VARCHAR(20) NULL;

UPDATE `student_snapshot` SET `contact_str` = CASE
    WHEN `contact` IS NULL THEN NULL
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 11
        THEN CAST(`contact` AS CHAR)
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 10
         AND CAST(`contact` AS CHAR) REGEXP '^1[0-9]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 10
         AND CAST(`contact` AS CHAR) REGEXP '^[3-6][0-9]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 9
         AND CAST(`contact` AS CHAR) REGEXP '^[2-6]'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    WHEN LENGTH(CAST(`contact` AS CHAR)) = 8
         AND CAST(`contact` AS CHAR) REGEXP '^2'
        THEN CONCAT('0', CAST(`contact` AS CHAR))
    ELSE NULL
END;

ALTER TABLE `student_snapshot` DROP COLUMN `contact`;
ALTER TABLE `student_snapshot` CHANGE COLUMN `contact_str` `contact` VARCHAR(20) NULL;

-- ────────────────────────────────────────────────────────────────────
-- Post-flight (적용 직후 반드시 실행)
-- ────────────────────────────────────────────────────────────────────
--
--   -- 1) row 수 보존 검증 (사전 카운트와 비교)
--   SELECT
--     (SELECT COUNT(*) FROM student WHERE contact IS NOT NULL) AS s_with_contact,
--     (SELECT COUNT(*) FROM student WHERE contact IS NULL)     AS s_null,
--     (SELECT COUNT(*) FROM student_snapshot WHERE contact IS NOT NULL) AS sn_with_contact,
--     (SELECT COUNT(*) FROM student_snapshot WHERE contact IS NULL)     AS sn_null;
--   -- s_with_contact는 사전 카운트의 s_with_contact 대비 ELSE→NULL 처리된 row만큼 감소 가능
--   -- 사전 점검 SQL #3에서 0건이었다면 사전과 동일해야 함
--
--   -- 2) 컬럼 타입 검증
--   SHOW COLUMNS FROM student LIKE 'contact';
--   SHOW COLUMNS FROM student_snapshot LIKE 'contact';
--   -- 기대: VARCHAR(20), NULL allowed
--
--   -- 3) 길이 분포 재확인
--   SELECT CHAR_LENGTH(contact) AS len, COUNT(*) AS cnt
--   FROM student WHERE contact IS NOT NULL GROUP BY len ORDER BY len;
--   -- 기대: 8~11자리만 분포

-- ────────────────────────────────────────────────────────────────────
-- Down Migration (rollback) — 비가역
-- ────────────────────────────────────────────────────────────────────
-- BIGINT 역변환 시 선행 0 손실. 본 마이그레이션은 무롤백을 전제로 한다.
-- 롤백이 필요한 경우 사전 백업으로만 복원 가능:
--   $ mysql -u <user> -p school_back < backup_student_contact_<TS>.sql
-- 참고용 SQL (실행 금지):
-- ALTER TABLE `student` ADD COLUMN `contact_int` BIGINT NULL;
-- UPDATE `student` SET `contact_int` = CAST(`contact` AS UNSIGNED) WHERE `contact` IS NOT NULL;
-- ALTER TABLE `student` DROP COLUMN `contact`;
-- ALTER TABLE `student` CHANGE COLUMN `contact_int` `contact` BIGINT NULL;

-- ────────────────────────────────────────────────────────────────────
-- Notes
-- ────────────────────────────────────────────────────────────────────
-- - 데이터 규모: student ~3,000 / student_snapshot < 3,000. MySQL 8.x online DDL (ALGORITHM=INPLACE, LOCK=NONE) 적용 가능.
--   ADD/DROP/RENAME 콤보는 케이스 따라 COPY 모드 폴백 가능 — dry run으로 락 영향 확인 권장.
-- - **배포 순서**: 백업 → DB 마이그레이션(Step 1 → 검증 → Step 2) → 코드 배포.
--   역순(코드 먼저 배포) 시: `?? null`이 String을 BigInt 컬럼에 INSERT → MySQL 묵시적 캐스트로 BigInt 저장(선행 0 다시 잘림). 절대 금지.
-- - **부분 실패 복구**: Step 1만 성공 후 Step 2 실패 시 student는 String, student_snapshot은 BigInt로 불일치.
--   이 상태에서 코드 배포 금지. 백업 복원 후 처음부터 재시도.
-- - **PII 보호**: 사전/사후 SQL 결과(contact 값)는 운영자 화면에만 표시하고 파일/로그/캡처 저장 금지.
-- - **patternsContact는 변경 없음**: 이미 `VARCHAR(20)` (parentContact는 하이픈/괄호 허용 — Zod max(20))
