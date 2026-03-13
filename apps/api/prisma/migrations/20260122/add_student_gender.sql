-- Migration: Add gender field to student table
-- Date: 2026-01-22
-- Feature: statistics-enhanced (대시보드 통계)
-- Description: 성별 분포 통계를 위한 gender 필드 추가

-- Up Migration
ALTER TABLE `student`
ADD COLUMN `gender` VARCHAR(10) NULL AFTER `catholic_name`;

-- Down Migration (rollback)
-- ALTER TABLE `student` DROP COLUMN `gender`;

-- Notes:
-- - gender 값: 'M' (남성), 'F' (여성), NULL (미지정)
-- - 기존 데이터는 NULL로 유지
-- - 통계 조회 시 NULL은 '미지정'으로 처리