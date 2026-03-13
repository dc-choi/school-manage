-- Migration: Registration 테이블 추가
-- Date: 2026-03-11
-- Feature: 학생 등록 관리 (로드맵 2단계)
-- Description: 학생의 연도별 등록 이력을 관리하는 Registration 테이블 생성

-- Up Migration
CREATE TABLE `registration` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `year` INT NOT NULL,
    `registered_at` DATETIME(3) NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `update_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    UNIQUE INDEX `registration_student_id_year_key`(`student_id`, `year`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `registration`
    ADD CONSTRAINT `registration_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `student`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Down Migration (rollback)
-- ALTER TABLE `registration` DROP FOREIGN KEY `registration_student_id_fkey`;
-- DROP TABLE `registration`;

-- Notes:
-- - studentId + year 유니크 제약으로 연도당 1건만 허용
-- - delete_at을 통한 소프트 삭제 지원 (등록 취소 시 사용)
-- - 적용: pnpm --filter @school/api prisma db push
