-- Migration: Church 이름 중복 방지 — normalized_name 컬럼 + (parish_id, normalized_name) UNIQUE
-- Date: 2026-05-14
-- Feature: church-name-unique (BUGFIX C-1+C-2+C-3)
-- Description:
--   교구 내 본당명 중복(공백 변형)을 DB 레벨에서 차단한다.
--   - normalized_name: name에서 모든 공백 제거한 값. 중복 검사 기준.
--   - C-3 결정: soft-deleted Church 서브트리를 물리 삭제하여 이름 슬롯/데이터 정리.
--   확인된 운영 데이터(2026-05-14): soft-deleted Church 6건(id 46,55,56,59,66 = org 0건 /
--   id 81 = org103→group696→student3214, 전부 soft-deleted). 활성 본당 정규화 충돌 0건.

-- ────────────────────────────────────────────────────────────────────
-- Pre-flight (운영 적용 전 반드시 실행)
-- ────────────────────────────────────────────────────────────────────
--
-- BACKUP REQUIRED — soft-deleted Church 서브트리 cascade 삭제는 비가역. 백업 없이 적용 금지.
--   $ mysqldump -u <user> -p school_back \
--       church organization `group` student account join_request \
--       student_group attendance student_snapshot registration \
--       group_snapshot account_snapshot refresh_token \
--       > backup_church_name_unique_$(date +%Y%m%d_%H%M%S).sql
--
-- Guard 1 — soft-deleted Church 서브트리에 살아있는(delete_at IS NULL) 데이터 (기대: 0행).
--   0행이 아니면 적용 중단. soft-deleted 본당에 살아있는 모임/학생이 붙어 있는 데이터 이상이므로
--   수동 검토 후 정리한다.
--   SELECT 'organization' AS tbl, o._id AS id FROM organization o
--     JOIN church c ON o.church_id = c._id
--     WHERE c.delete_at IS NOT NULL AND o.delete_at IS NULL
--   UNION ALL
--   SELECT 'group', g._id FROM `group` g
--     JOIN organization o ON g.organization_id = o._id
--     JOIN church c ON o.church_id = c._id
--     WHERE c.delete_at IS NOT NULL AND g.delete_at IS NULL
--   UNION ALL
--   SELECT 'student', s._id FROM student s
--     JOIN organization o ON s.organization_id = o._id
--     JOIN church c ON o.church_id = c._id
--     WHERE c.delete_at IS NOT NULL AND s.delete_at IS NULL
--   UNION ALL
--   SELECT 'account', a._id FROM account a
--     JOIN organization o ON a.organization_id = o._id
--     JOIN church c ON o.church_id = c._id
--     WHERE c.delete_at IS NOT NULL AND a.delete_at IS NULL;
--
-- Guard 2 — 활성 본당 정규화 충돌 (기대: 0행).
--   0행이 아니면 적용 중단. 충돌 본당을 수동 병합한 뒤 재시도한다.
--   SELECT parish_id,
--          REPLACE(REPLACE(REPLACE(REPLACE(name,' ',''),'\t',''),'\n',''),'\r','') AS nn,
--          COUNT(*) AS cnt, GROUP_CONCAT(_id) AS ids, GROUP_CONCAT(name SEPARATOR ' | ') AS names
--   FROM church WHERE delete_at IS NULL
--   GROUP BY parish_id, nn HAVING cnt > 1;
--
-- 두 Guard 모두 0행임을 확인한 뒤에만 Up Migration을 실행한다.

-- ────────────────────────────────────────────────────────────────────
-- Up Migration
-- ────────────────────────────────────────────────────────────────────
-- MySQL DDL은 implicit commit이라 단일 트랜잭션으로 묶을 수 없다. 순서대로 실행한다.
-- Step 1~10: soft-deleted Church 서브트리 물리 삭제 (FK 안전 순서 = 자식 → 부모).
--   각 DELETE는 "delete_at IS NOT NULL인 church의 서브트리에 속함" 조건으로 스코핑.
--   soft-deleted Church가 없는 DB(로컬/테스트)에서는 모두 no-op.

-- Step 1: attendance (student 자식)
DELETE att FROM attendance att
JOIN student s ON att.student_id = s._id
JOIN organization o ON s.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 2: student_group (student/group 자식)
DELETE sg FROM student_group sg
JOIN student s ON sg.student_id = s._id
JOIN organization o ON s.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 3: student_snapshot (student 자식)
DELETE ss FROM student_snapshot ss
JOIN student s ON ss.student_id = s._id
JOIN organization o ON s.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 4: registration (student 자식)
DELETE r FROM registration r
JOIN student s ON r.student_id = s._id
JOIN organization o ON s.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 5: group_snapshot (group 자식)
DELETE gs FROM group_snapshot gs
JOIN `group` g ON gs.group_id = g._id
JOIN organization o ON g.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 6: account_snapshot (account 자식)
DELETE asn FROM account_snapshot asn
JOIN account a ON asn.account_id = a._id
JOIN organization o ON a.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 7: refresh_token (account 자식)
DELETE rt FROM refresh_token rt
JOIN account a ON rt.account_id = a._id
JOIN organization o ON a.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 8: join_request (organization 자식)
DELETE jr FROM join_request jr
JOIN organization o ON jr.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 9: student / group / account (organization 자식)
DELETE s FROM student s
JOIN organization o ON s.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

DELETE g FROM `group` g
JOIN organization o ON g.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

DELETE a FROM account a
JOIN organization o ON a.organization_id = o._id
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

-- Step 10: organization (church 자식) → church
DELETE o FROM organization o
JOIN church c ON o.church_id = c._id
WHERE c.delete_at IS NOT NULL;

DELETE FROM church WHERE delete_at IS NOT NULL;

-- Step 11: normalized_name 컬럼 추가 (우선 nullable)
ALTER TABLE `church` ADD COLUMN `normalized_name` VARCHAR(50) NULL;

-- Step 12: 기존(활성) 행 백필 — 모든 공백 문자 제거
UPDATE `church`
SET `normalized_name` =
    REPLACE(REPLACE(REPLACE(REPLACE(`name`, ' ', ''), '\t', ''), '\n', ''), '\r', '')
WHERE `_id` > 0;

-- Step 13: NOT NULL 전환 + UNIQUE 인덱스 (Prisma @@unique 명명 규칙과 일치)
ALTER TABLE `church` MODIFY COLUMN `normalized_name` VARCHAR(50) NOT NULL;
ALTER TABLE `church`
    ADD UNIQUE INDEX `church_parish_id_normalized_name_key` (`parish_id`, `normalized_name`);

-- ────────────────────────────────────────────────────────────────────
-- Post-flight (적용 직후 확인)
-- ────────────────────────────────────────────────────────────────────
--   -- 1) soft-deleted Church 잔존 0건
--   SELECT COUNT(*) FROM church WHERE delete_at IS NOT NULL;   -- 기대: 0
--   -- 2) normalized_name NOT NULL + UNIQUE 적용
--   SHOW INDEX FROM church WHERE Key_name = 'church_parish_id_normalized_name_key';
--   SHOW COLUMNS FROM church LIKE 'normalized_name';           -- 기대: VARCHAR(50), NOT NULL
--   -- 3) 백필 검증 (모든 활성 행 normalized_name 채워짐)
--   SELECT COUNT(*) FROM church WHERE normalized_name IS NULL OR normalized_name = '';  -- 기대: 0

-- ────────────────────────────────────────────────────────────────────
-- Down Migration (rollback)
-- ────────────────────────────────────────────────────────────────────
-- 컬럼/제약 제거는 가능하나, 삭제된 soft-deleted Church 서브트리는 비가역.
-- 데이터 복원은 사전 백업으로만 가능: $ mysql -u <user> -p school_back < backup_church_name_unique_<TS>.sql
-- 참고용 SQL (실행 금지):
-- ALTER TABLE `church` DROP INDEX `church_parish_id_normalized_name_key`;
-- ALTER TABLE `church` DROP COLUMN `normalized_name`;

-- ────────────────────────────────────────────────────────────────────
-- Notes
-- ────────────────────────────────────────────────────────────────────
-- - 데이터 규모: church 87행 수준. MySQL online DDL(ALGORITHM=INPLACE)로 1초 미만.
-- - 백필 REPLACE는 space/tab/LF/CR만 제거. 애플리케이션의 normalizeChurchName(/\s+/g)이 신규 쓰기의 SSoT.
--   기존 데이터에 비ASCII 공백(U+00A0 등)이 있을 가능성은 극히 낮으나, Guard 2에서 충돌로 잡히면 수동 처리.
-- - 배포 순서: 백업 → Guard 1·2 확인 → Up Migration → prisma generate → 코드 배포.
-- - 로컬/테스트 DB: soft-deleted Church가 없어 Step 1~10은 no-op. 로컬은 `db:reset`으로 스키마 동기화
--   (seed.ts가 normalized_name 포함하도록 갱신됨).
