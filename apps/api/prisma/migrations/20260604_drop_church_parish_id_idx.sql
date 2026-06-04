-- Migration: Church 중복 단일 인덱스 제거 (church_parish_id_idx)
-- Date: 2026-06-04
-- Feature: Church @@index([parishId]) 중복 제거 (BUGFIX, church-name-unique reviewer 후속)
-- Description:
--   church 테이블의 단일 인덱스 church_parish_id_idx(parish_id)는
--   복합 유니크 church_parish_id_name_key(parish_id, name)의 leftmost prefix와 중복이다.
--   MySQL은 복합 인덱스의 leftmost prefix로 단일 컬럼 조회/정렬을 커버하므로
--   parish_id 단독 조회는 church_parish_id_name_key가 그대로 처리한다 → 단일 인덱스는 완전 중복.
--   church_parish_id_idx는 20260312/account_model_transition.sql에서 생성,
--   church_parish_id_name_key는 20260514/church_name_unique.sql에서 추가되어 중복 상태가 됨.

-- ────────────────────────────────────────────────────────────────────
-- FK 안전성
-- ────────────────────────────────────────────────────────────────────
--   FK church_parish_id_fkey(parish_id → parish._id)는 parish_id 인덱스를 요구한다.
--   InnoDB는 FK를 지원하는 인덱스가 둘 이상일 때, 그중 하나를 DROP해도 다른 인덱스가
--   해당 FK를 커버하면 DROP을 허용하고 FK를 남은 인덱스로 자동 전환한다.
--   church_parish_id_name_key(parish_id, name)가 leftmost prefix(parish_id)로 FK를 커버하므로
--   church_parish_id_idx를 DROP해도 "needed in a foreign key constraint"(errno 1553) 없이 성공한다.
--   데이터 손실 없음 — 인덱스 구조만 변경.

-- Up Migration
-- 주의: MySQL 8.0은 `DROP INDEX IF EXISTS`를 지원하지 않는다(errno 1064, MariaDB 전용 구문, 2026-06-04 실증).
-- 멱등성은 미적용 — 인덱스 부재 상태 재실행 시 errno 1091. 1회 적용 전제(프로젝트 마이그레이션 컨벤션 일치).
ALTER TABLE `church` DROP INDEX `church_parish_id_idx`;

-- Down Migration (rollback)
-- ALTER TABLE `church` ADD INDEX `church_parish_id_idx` (`parish_id`);

-- Notes:
-- - 검증: SHOW INDEX FROM church; 로 church_parish_id_idx 부재 + church_parish_id_name_key 존재 확인.
-- - FK 유지 확인: SHOW CREATE TABLE church; 에 church_parish_id_fkey 제약이 남아있는지 확인.
-- - `prisma db push`는 이 중복 인덱스 drift를 감지/드롭하지 못한다("이미 동기화됨" 오판정, 2026-06-04 실증).
--   따라서 운영/로컬 모두 이 명시적 ALTER로 1회 적용해야 한다(force-reset 신규 생성 DB는 schema 기준이라 애초에 없음).
