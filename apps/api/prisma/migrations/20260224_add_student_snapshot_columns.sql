-- Migration: StudentSnapshot 테이블에 contact, description, baptized_at 컬럼 추가
-- Date: 2026-02-24
-- Description: 운영 DB에 이미 생성된 student_snapshot 테이블에 누락된 3개 컬럼 추가 + 기존 스냅샷 데이터 역보정

-- ============================================================
-- DDL: 컬럼 추가
-- ============================================================

ALTER TABLE `student_snapshot` ADD COLUMN `contact` BIGINT NULL;
ALTER TABLE `student_snapshot` ADD COLUMN `description` TEXT NULL;
ALTER TABLE `student_snapshot` ADD COLUMN `baptized_at` VARCHAR(10) NULL;

-- ============================================================
-- DML: 기존 스냅샷 데이터 역보정 (student 테이블 기준)
-- ============================================================

UPDATE student_snapshot ss
JOIN student s ON ss.student_id = s._id
SET ss.contact = s.contact,
    ss.description = s.description,
    ss.baptized_at = s.baptized_at;

-- ============================================================
-- 검증
-- ============================================================

SELECT
    COUNT(*) AS total_snapshots,
    SUM(CASE WHEN contact IS NOT NULL THEN 1 ELSE 0 END) AS with_contact,
    SUM(CASE WHEN description IS NOT NULL THEN 1 ELSE 0 END) AS with_description,
    SUM(CASE WHEN baptized_at IS NOT NULL THEN 1 ELSE 0 END) AS with_baptized_at
FROM student_snapshot;

-- Down Migration (rollback)
-- ALTER TABLE `student_snapshot` DROP COLUMN `contact`;
-- ALTER TABLE `student_snapshot` DROP COLUMN `description`;
-- ALTER TABLE `student_snapshot` DROP COLUMN `baptized_at`;
