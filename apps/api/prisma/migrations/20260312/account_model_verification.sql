-- Verification: 계정 모델 전환 데이터 마이그레이션 검증
-- Date: 2026-03-12
-- Description: 마이그레이션 전후 데이터 정합성 자동 검증 쿼리

-- ============================================================
-- 1. 전체 건수 검증 (마이그레이션 전후 변경 없어야 함)
-- ============================================================

-- 1-1. Account 총 건수 (38개 예상, 배포 시점 재확인)
SELECT '1-1. Account 총 건수' AS test,
       COUNT(*) AS total,
       SUM(CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END) AS migrated,
       SUM(CASE WHEN organization_id IS NULL THEN 1 ELSE 0 END) AS unaffiliated
FROM account
WHERE delete_at IS NULL;
-- 예상: total=38, migrated=20, unaffiliated=18

-- 1-2. Group 총 건수 (마이그레이션 전후 동일)
SELECT '1-2. Group 총 건수' AS test,
       COUNT(*) AS total,
       SUM(CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END) AS with_org,
       SUM(CASE WHEN organization_id IS NULL THEN 1 ELSE 0 END) AS without_org
FROM `group`
WHERE delete_at IS NULL;

-- 1-3. Student 총 건수 (마이그레이션 전후 동일)
SELECT '1-3. Student 총 건수' AS test,
       COUNT(*) AS total,
       SUM(CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END) AS with_org,
       SUM(CASE WHEN organization_id IS NULL THEN 1 ELSE 0 END) AS without_org
FROM student
WHERE delete_at IS NULL;

-- 1-4. Attendance 총 건수 (변경 없어야 함)
SELECT '1-4. Attendance 총 건수' AS test, COUNT(*) AS total
FROM attendance
WHERE delete_at IS NULL;

-- 1-5. StudentGroup 레코드 수 = Student 수 (1:1 마이그레이션)
SELECT '1-5. StudentGroup vs Student' AS test,
       (SELECT COUNT(*) FROM student) AS student_count,
       (SELECT COUNT(*) FROM student_group) AS student_group_count;
-- 예상: 두 값 동일

-- ============================================================
-- 2. 자동 마이그레이션 계정 상세 검증 (20개)
-- ============================================================

-- 2-1. 마이그레이션 계정 목록: Account → Organization → Church → Parish 체인
SELECT '2-1. 마이그레이션 계정 체인' AS test,
       a._id AS account_id,
       a.display_name,
       a.role,
       o.name AS org_name,
       c.name AS church_name,
       p.name AS parish_name
FROM account a
JOIN organization o ON a.organization_id = o._id
JOIN church c ON o.church_id = c._id
JOIN parish p ON c.parish_id = p._id
WHERE a.organization_id IS NOT NULL
ORDER BY a._id;
-- 예상: 20행, 각 행에 올바른 본당/교구 매핑

-- 2-2. 구룡 성당: 1개 Church에 2개 Organization
SELECT '2-2. 구룡 성당 검증' AS test,
       c.name AS church_name,
       o.name AS org_name,
       a._id AS account_id,
       a.display_name
FROM church c
JOIN organization o ON o.church_id = c._id
JOIN account a ON a.organization_id = o._id
WHERE c.name = '구룡 성당'
ORDER BY a._id;
-- 예상: 2행 (id:37 주일학교, id:38 초등부)

-- 2-3. Group.organizationId 정합성: Account와 동일한 org
SELECT '2-3. Group org 정합성' AS test,
       g._id AS group_id,
       g.name AS group_name,
       g.organization_id AS group_org,
       a.organization_id AS account_org,
       CASE WHEN g.organization_id = a.organization_id THEN 'OK' ELSE 'MISMATCH' END AS status
FROM `group` g
JOIN account a ON g.account_id = a._id
WHERE a.organization_id IS NOT NULL
  AND g.delete_at IS NULL;
-- 예상: 모든 행 status = 'OK'

-- 2-4. Student.organizationId 정합성: Group과 동일한 org
SELECT '2-4. Student org 정합성' AS test,
       COUNT(*) AS total,
       SUM(CASE WHEN s.organization_id = g.organization_id THEN 1 ELSE 0 END) AS matching,
       SUM(CASE WHEN s.organization_id != g.organization_id THEN 1 ELSE 0 END) AS mismatched
FROM student s
JOIN `group` g ON s.group_id = g._id
WHERE g.organization_id IS NOT NULL
  AND s.delete_at IS NULL;
-- 예상: mismatched = 0

-- ============================================================
-- 3. 레퍼런스 계정 (장위동, id:2) 상세 검증
-- ============================================================

-- 3-1. 장위동: 3그룹 55학생 2972출석
SELECT '3-1. 장위동 그룹' AS test,
       COUNT(*) AS group_count
FROM `group`
WHERE account_id = 2 AND delete_at IS NULL;
-- 예상: 3

SELECT '3-1. 장위동 학생' AS test,
       COUNT(*) AS student_count
FROM student s
JOIN `group` g ON s.group_id = g._id
WHERE g.account_id = 2 AND s.delete_at IS NULL;
-- 예상: 55

SELECT '3-1. 장위동 출석' AS test,
       COUNT(*) AS attendance_count
FROM attendance att
JOIN student s ON att.student_id = s._id
JOIN `group` g ON s.group_id = g._id
WHERE g.account_id = 2 AND att.delete_at IS NULL;
-- 예상: 2972

-- 3-2. 장위동: Organization 연결 확인
SELECT '3-2. 장위동 org 연결' AS test,
       a.organization_id IS NOT NULL AS has_org,
       o.name AS org_name,
       c.name AS church_name,
       p.name AS parish_name
FROM account a
LEFT JOIN organization o ON a.organization_id = o._id
LEFT JOIN church c ON o.church_id = c._id
LEFT JOIN parish p ON c.parish_id = p._id
WHERE a._id = 2;
-- 예상: has_org=1, org_name='장위동 중고등부', church_name='장위동 성당', parish_name='서울대교구'

-- ============================================================
-- 4. 미소속 계정 검증 (18개)
-- ============================================================

-- 4-1. 미소속 계정: organizationId NULL 확인
SELECT '4-1. 미소속 계정' AS test,
       a._id AS account_id,
       a.display_name,
       a.organization_id,
       a.role,
       (SELECT COUNT(*) FROM `group` WHERE account_id = a._id AND delete_at IS NULL) AS groups,
       (SELECT COUNT(*) FROM student WHERE group_id IN (SELECT _id FROM `group` WHERE account_id = a._id) AND delete_at IS NULL) AS students
FROM account a
WHERE a.organization_id IS NULL
  AND a.delete_at IS NULL
ORDER BY a._id;
-- 예상: 18행, 모든 행 organization_id = NULL, role = NULL

-- 4-2. 황보나 (id:31) 데이터 존재 확인
SELECT '4-2. 황보나 데이터' AS test,
       (SELECT COUNT(*) FROM `group` WHERE account_id = 31 AND delete_at IS NULL) AS groups,
       (SELECT COUNT(*) FROM student WHERE group_id IN (SELECT _id FROM `group` WHERE account_id = 31) AND delete_at IS NULL) AS students,
       (SELECT COUNT(*) FROM attendance WHERE student_id IN (SELECT _id FROM student WHERE group_id IN (SELECT _id FROM `group` WHERE account_id = 31)) AND delete_at IS NULL) AS attendances;
-- 예상: groups=6, students=22, attendances=32

-- ============================================================
-- 5. 신규 테이블 건수 검증
-- ============================================================

SELECT '5-1. Parish' AS test, COUNT(*) AS count FROM parish;
-- 예상: 16

SELECT '5-2. Church' AS test, COUNT(*) AS count FROM church;
-- 예상: 19

SELECT '5-3. Organization' AS test, COUNT(*) AS count FROM organization;
-- 예상: 20

SELECT '5-4. StudentGroup' AS test, COUNT(*) AS count FROM student_group;
-- 예상: (전체 Student 수와 동일)

SELECT '5-5. JoinRequest' AS test, COUNT(*) AS count FROM join_request;
-- 예상: 0 (아직 합류 요청 없음)

SELECT '5-6. AccountSnapshot' AS test, COUNT(*) AS count FROM account_snapshot;
-- 예상: 20 (마이그레이션 계정만)

-- ============================================================
-- 6. StudentSnapshot 백필 검증
-- ============================================================

SELECT '6-1. StudentSnapshot 백필' AS test,
       COUNT(*) AS total,
       SUM(CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END) AS with_org,
       SUM(CASE WHEN organization_id IS NULL THEN 1 ELSE 0 END) AS without_org
FROM student_snapshot;
-- 예상: with_org = 마이그레이션 계정의 스냅샷 수, without_org = 미소속 계정의 스냅샷 수

-- ============================================================
-- 검증 완료 기준:
-- - 1-1~1-5: 건수 일치, mismatched = 0
-- - 2-1: 20행, 올바른 매핑
-- - 2-2: 구룡 성당 2개 org
-- - 2-3~2-4: 모든 status = OK, mismatched = 0
-- - 3-1~3-2: 장위동 데이터 정상
-- - 4-1~4-2: 미소속 18개 NULL, 황보나 데이터 존재
-- - 5-1~5-6: 신규 테이블 건수 정상
-- ============================================================
