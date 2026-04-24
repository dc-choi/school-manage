-- Migration: Add parent_contact column to student and student_snapshot
-- Date: 2026-04-24
-- Feature: student-extra-fields (로드맵 2단계 FUNCTIONAL)
-- Description:
--   학생 부모님 연락처(parentContact) 필드를 정규 컬럼으로 추가한다.
--   - 기존 Student.contact(BigInt, 학생 본인)와 별도의 String 문자열 필드
--   - 사용자 입력 원본 그대로 저장 (하이픈·괄호·공백 허용, max 20자)
--   - StudentSnapshot에도 동일 필드 추가하여 이력 일관성 유지
--   - nullable + 기본값 없음 → 기존 INSERT/UPDATE 경로 비파괴, 무중단 배포

-- Up Migration
ALTER TABLE `student`
    ADD COLUMN `parent_contact` VARCHAR(20) NULL AFTER `contact`;

ALTER TABLE `student_snapshot`
    ADD COLUMN `parent_contact` VARCHAR(20) NULL AFTER `contact`;

-- Down Migration (rollback)
-- ALTER TABLE `student` DROP COLUMN `parent_contact`;
-- ALTER TABLE `student_snapshot` DROP COLUMN `parent_contact`;

-- Notes:
-- - Snapshot 이력은 롤백 시 소실됨 → 배포 확정 후 되돌림은 권장하지 않음
-- - Student.contact(BigInt) 타입은 본 마이그레이션에서 변경하지 않음
--   (별도 TARGET BUGFIX "Student.contact 타입 이관"으로 분리)
-- - VARCHAR(20)은 숫자·하이픈·괄호·공백 조합 전화번호를 포괄 (예: "(02) 1234-5678" = 15자)
