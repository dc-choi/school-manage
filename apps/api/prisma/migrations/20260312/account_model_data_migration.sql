-- Migration: 계정 모델 전환 데이터 마이그레이션
-- Date: 2026-03-12
-- Feature: 38개 기존 계정 데이터 이관
-- Description: 20개 자동 마이그레이션 + 18개 미소속 처리 + StudentGroup 생성 + 스냅샷 백필
-- Depends: 20260312_account_model_transition.sql (스키마 + Parish 시드)
-- ⚠️ 배포 시점에 DB 최신 조회로 매핑 테이블 재검증 필수

-- ============================================================
-- 1. Church 생성 (19개 고유 본당)
-- ============================================================

INSERT INTO church (name, parish_id, create_at) VALUES
('장위동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('정릉4동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('가재울 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('구룡 성당', (SELECT _id FROM parish WHERE name = '청주교구'), NOW()),
('야탑동 성당', (SELECT _id FROM parish WHERE name = '수원교구'), NOW()),
('창5동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('성현동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('성북동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('철원 성당', (SELECT _id FROM parish WHERE name = '춘천교구'), NOW()),
('창동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('성남동 성당', (SELECT _id FROM parish WHERE name = '수원교구'), NOW()),
('보라동 성당', (SELECT _id FROM parish WHERE name = '수원교구'), NOW()),
('흑석동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('길음동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('월곡동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('중림동약현성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('대동 성당', (SELECT _id FROM parish WHERE name = '대전교구'), NOW()),
('신당동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW()),
('양재2동 성당', (SELECT _id FROM parish WHERE name = '서울대교구'), NOW());

-- ============================================================
-- 2. Organization 생성 + Account 연결 (20개)
--    패턴: INSERT org → @org_id 캡처 → UPDATE account
-- ============================================================

-- Account 2: 장위동 중고등부 → 장위동 성당 (서울대교구) [레퍼런스, 3그룹 55학생 2972출석]
INSERT INTO organization (name, church_id, create_at)
VALUES ('장위동 중고등부', (SELECT _id FROM church WHERE name = '장위동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 2;

-- Account 4: 정릉4동 → 정릉4동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('정릉4동', (SELECT _id FROM church WHERE name = '정릉4동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 4;

-- Account 20: 가재울중고등부 → 가재울 성당 (서울대교구) [파워 유저]
INSERT INTO organization (name, church_id, create_at)
VALUES ('가재울중고등부', (SELECT _id FROM church WHERE name = '가재울 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 20;

-- Account 37: 구룡성당 주일학교 → 구룡 성당 (청주교구) [같은 Church → id:38]
INSERT INTO organization (name, church_id, create_at)
VALUES ('구룡성당 주일학교', (SELECT _id FROM church WHERE name = '구룡 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 37;

-- Account 38: 구룡성당 주일학교 초등부 → 구룡 성당 (청주교구) [같은 Church → id:37]
INSERT INTO organization (name, church_id, create_at)
VALUES ('구룡성당 주일학교 초등부', (SELECT _id FROM church WHERE name = '구룡 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 38;

-- Account 34: 야탑동 중고등부 주일학교 → 야탑동 성당 (수원교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('야탑동 중고등부 주일학교', (SELECT _id FROM church WHERE name = '야탑동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 34;

-- Account 33: 창5동성당 중고등부 주일학교 → 창5동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('창5동성당 중고등부 주일학교', (SELECT _id FROM church WHERE name = '창5동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 33;

-- Account 36: 성현동성당 중고등부 → 성현동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('성현동성당 중고등부', (SELECT _id FROM church WHERE name = '성현동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 36;

-- Account 41: 성북동성당 중고등부 → 성북동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('성북동성당 중고등부', (SELECT _id FROM church WHERE name = '성북동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 41;

-- Account 44: 철원성당 중고등부 → 철원 성당 (춘천교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('철원성당 중고등부', (SELECT _id FROM church WHERE name = '철원 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 44;

-- Account 23: 창동성당 중고등부 → 창동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('창동성당 중고등부', (SELECT _id FROM church WHERE name = '창동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 23;

-- Account 29: 성남동성당중고등부 → 성남동 성당 (수원교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('성남동성당중고등부', (SELECT _id FROM church WHERE name = '성남동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 29;

-- Account 35: 보라동성당 중고등부 주일학교 → 보라동 성당 (수원교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('보라동성당 중고등부 주일학교', (SELECT _id FROM church WHERE name = '보라동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 35;

-- Account 22: 서윤우 노엘 → 흑석동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('서윤우 노엘', (SELECT _id FROM church WHERE name = '흑석동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 22;

-- Account 24: 길음동 → 길음동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('길음동', (SELECT _id FROM church WHERE name = '길음동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 24;

-- Account 30: 월곡동 중고등부 → 월곡동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('월곡동 중고등부', (SELECT _id FROM church WHERE name = '월곡동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 30;

-- Account 43: 중림동약현성당 주일학교 → 중림동약현성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('중림동약현성당 주일학교', (SELECT _id FROM church WHERE name = '중림동약현성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 43;

-- Account 45: 보령동대동성당 중고등부 교사 → 대동 성당 (대전교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('보령동대동성당 중고등부 교사', (SELECT _id FROM church WHERE name = '대동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 45;

-- Account 11: 신당동성당 중고등부 → 신당동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('신당동성당 중고등부', (SELECT _id FROM church WHERE name = '신당동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 11;

-- Account 27: 양재 2동 → 양재2동 성당 (서울대교구)
INSERT INTO organization (name, church_id, create_at)
VALUES ('양재 2동', (SELECT _id FROM church WHERE name = '양재2동 성당'), NOW());
SET @org_id = LAST_INSERT_ID();
UPDATE account SET organization_id = @org_id, role = 'ADMIN' WHERE _id = 27;

-- ============================================================
-- 3. Group.organizationId 일괄 설정
--    Account의 organizationId를 Group에 전파
-- ============================================================

UPDATE `group` g
JOIN account a ON g.account_id = a._id
SET g.organization_id = a.organization_id
WHERE a.organization_id IS NOT NULL;

-- ============================================================
-- 4. Student.organizationId 일괄 설정
--    Group의 organizationId를 Student에 전파
-- ============================================================

UPDATE student s
JOIN `group` g ON s.group_id = g._id
SET s.organization_id = g.organization_id
WHERE g.organization_id IS NOT NULL;

-- ============================================================
-- 5. StudentGroup 레코드 생성
--    기존 Student.groupId 관계를 N:M 중간 테이블로 복제
--    (마이그레이션 대상 + 미소속 모두 포함)
-- ============================================================

INSERT INTO student_group (student_id, group_id, create_at)
SELECT s._id, s.group_id, NOW()
FROM student s;

-- ============================================================
-- 6. StudentSnapshot.organizationId 백필
--    스냅샷의 groupId를 기반으로 Organization 연결
-- ============================================================

UPDATE student_snapshot ss
JOIN `group` g ON ss.group_id = g._id
SET ss.organization_id = g.organization_id
WHERE g.organization_id IS NOT NULL;

-- ============================================================
-- 7. AccountSnapshot 초기 생성 (마이그레이션 시점)
--    조직 연결된 계정만 (20개)
-- ============================================================

INSERT INTO account_snapshot (account_id, name, display_name, organization_id, snapshot_at)
SELECT a._id, a.name, a.display_name, a.organization_id, NOW()
FROM account a
WHERE a.organization_id IS NOT NULL
  AND a.delete_at IS NULL;

-- ============================================================
-- 미소속 처리 (18개): 별도 조치 없음
-- organizationId = NULL 유지 → 로그인 시 /join 리다이렉트
-- ============================================================
-- id 31 (황보나): 본당 불명, 22학생 32출석 → /join 후 수동 데이터 재연결 필요
-- id 28 (신호정), 18 (veronica), 26 (Andreas), 40 (우서현): 본당 불명
-- id 21 (김민건), 25 (이재용), 17 (짓우), 46 (조인환), 39 (티키카타): 본당 불명
-- id 32 (박민규), 19 (김지민 엘리사벳), 13 (임현승), 42 (임정민): 본당 불명
-- id 16 (금호동성당), 15 (금호동성당 청소년부): 동일 본당 중복 계정
-- id 12 (신정동성당 주일학교): 미사용 (그룹 0)
-- id 47 (1223334444): 테스트 계정 추정

-- ============================================================
-- Down Migration (rollback)
-- ============================================================
-- DELETE FROM account_snapshot WHERE snapshot_at >= '2026-03-12';
-- DELETE FROM student_group;
-- UPDATE student_snapshot SET organization_id = NULL;
-- UPDATE student SET organization_id = NULL;
-- UPDATE `group` SET organization_id = NULL;
-- UPDATE account SET organization_id = NULL, role = NULL;
-- DELETE FROM organization;
-- DELETE FROM church;

-- ============================================================
-- Notes:
-- - 배포 시점에 DB 최신 조회로 계정 수 재검증 필수
-- - 구룡 성당: 2개 Organization (주일학교 id:37 + 초등부 id:38) → 1개 Church
-- - 미소속 18개: organizationId NULL 유지, /join 자연 유도
-- - 황보나 (id:31): 22학생 + 32출석 데이터 있음, /join 후 수동 재연결 필요
-- - StudentGroup: 전체 학생 대상 생성 (미소속 포함, 기존 groupId 관계 보존)
-- - 적용 순서: 스키마 마이그레이션 → 이 파일 실행
-- ============================================================
