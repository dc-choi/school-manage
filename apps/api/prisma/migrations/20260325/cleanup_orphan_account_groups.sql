-- 데이터 복구 불필요 계정들의 그룹 관계 정리
-- 대상 account_id: 8, 16, 17, 25, 26, 39, 40, 46, 47
-- 제외: 21 (김민건, 과천) → 과천성당 중고등부로 복구

-- ============================================================
-- Phase 1: 9개 계정 데이터 정리 (FK 역순 삭제)
-- ============================================================

-- Step 1: attendance 삭제
DELETE a FROM attendance a
INNER JOIN student_group sg ON a.student_id = sg.student_id
INNER JOIN `group` g ON sg.group_id = g._id
WHERE g.account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- Step 2: student_snapshot 삭제
DELETE ss FROM student_snapshot ss
INNER JOIN student_group sg ON ss.student_id = sg.student_id
INNER JOIN `group` g ON sg.group_id = g._id
WHERE g.account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- Step 3: registration 삭제
DELETE r FROM registration r
INNER JOIN student_group sg ON r.student_id = sg.student_id
INNER JOIN `group` g ON sg.group_id = g._id
WHERE g.account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- Step 4: student_group 삭제
DELETE sg FROM student_group sg
INNER JOIN `group` g ON sg.group_id = g._id
WHERE g.account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- Step 5: 고아 student 삭제 (그룹 없고 조직도 없는 학생)
DELETE s FROM student s
LEFT JOIN student_group sg ON s._id = sg.student_id
WHERE sg._id IS NULL
AND s.organization_id IS NULL;

-- Step 6: group_snapshot 삭제
DELETE gs FROM group_snapshot gs
INNER JOIN `group` g ON gs.group_id = g._id
WHERE g.account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- Step 7: group 삭제
DELETE FROM `group`
WHERE account_id IN (8, 16, 17, 25, 26, 39, 40, 46, 47);

-- ============================================================
-- Phase 2: 과천성당 생성 + 김민건 복구 (account_id 제거 전에 실행)
-- ============================================================

-- Step 1: 과천성당 생성
INSERT INTO church (name, parish_id, create_at)
SELECT '과천성당', _id, NOW()
FROM parish WHERE name = '수원교구';

-- Step 2: 과천성당 중고등부 조직 생성
INSERT INTO organization (name, type, church_id, create_at)
SELECT '과천성당 중고등부', 'MIDDLE_HIGH', _id, NOW()
FROM church WHERE name = '과천성당';

-- Step 3: 김민건(_id=21) 계정을 과천성당 중고등부에 연결
UPDATE account
SET organization_id = (SELECT _id FROM organization WHERE name = '과천성당 중고등부'),
    role = 'ADMIN',
    update_at = NOW()
WHERE _id = 21;

-- Step 4: 김민건의 그룹을 과천성당 중고등부에 연결
UPDATE `group`
SET organization_id = (SELECT _id FROM organization WHERE name = '과천성당 중고등부')
WHERE account_id = 21;

-- ============================================================
-- Phase 3: account_id 컬럼 제거 (Account ↔ Group 관계 해제)
-- ============================================================

ALTER TABLE `group` DROP FOREIGN KEY `group_account_id_fkey`;
ALTER TABLE `group` DROP INDEX `group_account_id_idx`;
ALTER TABLE `group` DROP COLUMN `account_id`;
