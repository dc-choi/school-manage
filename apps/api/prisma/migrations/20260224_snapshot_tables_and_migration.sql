-- Migration: 스냅샷 테이블 생성 + 기존 데이터 마이그레이션
-- Date: 2026-02-24
-- Feature: statistics-snapshot
-- Description: StudentSnapshot, GroupSnapshot 테이블 생성, Attendance에 group_id 추가, 기존 데이터 초기 스냅샷 생성 및 역보정

-- ============================================================
-- DDL: 스키마 변경
-- ============================================================

-- Up Migration

-- 1. StudentSnapshot 테이블 생성
CREATE TABLE `student_snapshot` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `society_name` VARCHAR(50) NOT NULL,
    `catholic_name` VARCHAR(50) NULL,
    `gender` VARCHAR(10) NULL,
    `group_id` BIGINT NOT NULL,
    `snapshot_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`_id`),
    INDEX `student_snapshot_student_id_snapshot_at_idx`(`student_id`, `snapshot_at`),
    CONSTRAINT `student_snapshot_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 2. GroupSnapshot 테이블 생성
CREATE TABLE `group_snapshot` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `group_id` BIGINT NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `snapshot_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`_id`),
    INDEX `group_snapshot_group_id_snapshot_at_idx`(`group_id`, `snapshot_at`),
    CONSTRAINT `group_snapshot_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `group`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Attendance에 group_id 컬럼 추가
ALTER TABLE `attendance` ADD COLUMN `group_id` BIGINT NULL;

-- 4. 기존 테이블 FK 추가 (물리적 참조 무결성 설정)
-- 주의: 고아 레코드가 있으면 실패할 수 있음 → 실행 전 고아 레코드 확인 필수
ALTER TABLE `group`
    ADD CONSTRAINT `group_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `student`
    ADD CONSTRAINT `student_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `group`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `attendance`
    ADD CONSTRAINT `attendance_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `attendance`
    ADD CONSTRAINT `attendance_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `group`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- DML: 기존 데이터 마이그레이션
-- ============================================================

-- 5. 기존 Student -> StudentSnapshot 초기 생성 (deletedAt, graduatedAt 무관 -- 전체)
INSERT INTO student_snapshot (student_id, society_name, catholic_name, gender, group_id, snapshot_at)
SELECT _id, society_name, catholic_name, gender, group_id, NOW()
FROM student;

-- 6. 기존 Group -> GroupSnapshot 초기 생성 (deletedAt 무관 -- 전체)
INSERT INTO group_snapshot (group_id, name, snapshot_at)
SELECT _id, name, NOW()
FROM `group`;

-- 7. Attendance groupId 역보정 (group_id가 NULL인 레코드만)
UPDATE attendance a
JOIN student s ON a.student_id = s._id
SET a.group_id = s.group_id
WHERE a.group_id IS NULL;

-- ============================================================
-- 검증
-- ============================================================

-- 8. 결과 확인
SELECT 'student_snapshot' AS table_name, COUNT(*) AS count FROM student_snapshot
UNION ALL
SELECT 'group_snapshot', COUNT(*) FROM group_snapshot
UNION ALL
SELECT 'attendance_group_id_filled', COUNT(*) FROM attendance WHERE group_id IS NOT NULL
UNION ALL
SELECT 'attendance_group_id_null', COUNT(*) FROM attendance WHERE group_id IS NULL;

-- ============================================================
-- 사전 확인: 고아 레코드 점검 (FK 추가 전 실행 권장)
-- 아래 쿼리 결과가 0이어야 FK 추가가 안전함
-- ============================================================
-- SELECT COUNT(*) AS orphan_groups FROM `group` g LEFT JOIN account a ON g.account_id = a._id WHERE a._id IS NULL;
-- SELECT COUNT(*) AS orphan_students FROM student s LEFT JOIN `group` g ON s.group_id = g._id WHERE g._id IS NULL;
-- SELECT COUNT(*) AS orphan_attendances FROM attendance a LEFT JOIN student s ON a.student_id = s._id WHERE s._id IS NULL;

-- Down Migration (rollback)
-- ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_group_id_fkey`;
-- ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_student_id_fkey`;
-- ALTER TABLE `student` DROP FOREIGN KEY `student_group_id_fkey`;
-- ALTER TABLE `group` DROP FOREIGN KEY `group_account_id_fkey`;
-- DROP TABLE IF EXISTS `student_snapshot`;
-- DROP TABLE IF EXISTS `group_snapshot`;
-- ALTER TABLE `attendance` DROP COLUMN `group_id`;

-- Notes:
-- - 역보정은 현재 Student.groupId 기준이므로, 과거 다른 그룹에 속했던 기록도 현재 그룹으로 설정됨 (최선 추정)
-- - 운영 DB에 직접 복사-붙여넣기로 실행
