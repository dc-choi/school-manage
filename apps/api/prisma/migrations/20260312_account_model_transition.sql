-- Migration: 계정 모델 전환 스키마 변경
-- Date: 2026-03-12
-- Feature: 계정 모델 전환 (공유 계정 → 개인 계정 + 본당/조직 구조)
-- Description: 신규 6개 테이블 생성 + 기존 4개 테이블 nullable 컬럼 추가 + Parish 시드 데이터

-- ============================================================
-- 1. 신규 테이블 생성
-- ============================================================

-- Parish (교구)
CREATE TABLE `parish` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Church (본당)
CREATE TABLE `church` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `parish_id` BIGINT NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    INDEX `church_parish_id_idx`(`parish_id`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `church`
    ADD CONSTRAINT `church_parish_id_fkey`
    FOREIGN KEY (`parish_id`) REFERENCES `parish`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Organization (조직)
CREATE TABLE `organization` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `church_id` BIGINT NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    INDEX `organization_church_id_idx`(`church_id`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `organization`
    ADD CONSTRAINT `organization_church_id_fkey`
    FOREIGN KEY (`church_id`) REFERENCES `church`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- StudentGroup (Student-Group N:M 중간 테이블)
CREATE TABLE `student_group` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `group_id` BIGINT NOT NULL,
    `create_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_group_student_id_group_id_key`(`student_id`, `group_id`),
    INDEX `student_group_student_id_idx`(`student_id`),
    INDEX `student_group_group_id_idx`(`group_id`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_group`
    ADD CONSTRAINT `student_group_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `student`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `student_group`
    ADD CONSTRAINT `student_group_group_id_fkey`
    FOREIGN KEY (`group_id`) REFERENCES `group`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- JoinRequest (합류 요청)
CREATE TABLE `join_request` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT NOT NULL,
    `organization_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `update_at` DATETIME(3) NOT NULL,

    INDEX `join_request_organization_id_status_idx`(`organization_id`, `status`),
    INDEX `join_request_account_id_status_idx`(`account_id`, `status`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `join_request`
    ADD CONSTRAINT `join_request_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `account`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `join_request`
    ADD CONSTRAINT `join_request_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AccountSnapshot (계정 스냅샷)
CREATE TABLE `account_snapshot` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `account_id` BIGINT NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `display_name` VARCHAR(20) NOT NULL,
    `organization_id` BIGINT NOT NULL,
    `snapshot_at` DATETIME(3) NOT NULL,

    INDEX `account_snapshot_account_id_snapshot_at_idx`(`account_id`, `snapshot_at`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `account_snapshot`
    ADD CONSTRAINT `account_snapshot_account_id_fkey`
    FOREIGN KEY (`account_id`) REFERENCES `account`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 2. 기존 테이블 nullable 컬럼 추가
-- ============================================================

-- Account: organizationId, role 추가
ALTER TABLE `account`
    ADD COLUMN `organization_id` BIGINT NULL,
    ADD COLUMN `role` VARCHAR(20) NULL;

ALTER TABLE `account`
    ADD CONSTRAINT `account_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `account_organization_id_idx` ON `account`(`organization_id`);

-- Group: organizationId 추가 + 기존 account_id 인덱스
ALTER TABLE `group`
    ADD COLUMN `organization_id` BIGINT NULL;

ALTER TABLE `group`
    ADD CONSTRAINT `group_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `group_account_id_idx` ON `group`(`account_id`);
CREATE INDEX `group_organization_id_idx` ON `group`(`organization_id`);

-- Student: organizationId 추가 + 기존 group_id 인덱스
ALTER TABLE `student`
    ADD COLUMN `organization_id` BIGINT NULL;

ALTER TABLE `student`
    ADD CONSTRAINT `student_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `student_group_id_idx` ON `student`(`group_id`);
CREATE INDEX `student_organization_id_idx` ON `student`(`organization_id`);

-- StudentSnapshot: organizationId 추가
ALTER TABLE `student_snapshot`
    ADD COLUMN `organization_id` BIGINT NULL;

-- ============================================================
-- 3. Parish 시드 데이터 (16개 한국 가톨릭 교구)
-- ============================================================

INSERT INTO `parish` (`name`, `create_at`) VALUES
('서울대교구', NOW()),
('수원교구', NOW()),
('인천교구', NOW()),
('의정부교구', NOW()),
('대전교구', NOW()),
('청주교구', NOW()),
('춘천교구', NOW()),
('원주교구', NOW()),
('대구대교구', NOW()),
('부산교구', NOW()),
('안동교구', NOW()),
('마산교구', NOW()),
('광주대교구', NOW()),
('전주교구', NOW()),
('제주교구', NOW()),
('군종교구', NOW());

-- ============================================================
-- Down Migration (rollback)
-- ============================================================
-- ALTER TABLE `student_snapshot` DROP COLUMN `organization_id`;
-- ALTER TABLE `student` DROP FOREIGN KEY `student_organization_id_fkey`;
-- ALTER TABLE `student` DROP COLUMN `organization_id`;
-- ALTER TABLE `group` DROP FOREIGN KEY `group_organization_id_fkey`;
-- ALTER TABLE `group` DROP COLUMN `organization_id`;
-- ALTER TABLE `account` DROP FOREIGN KEY `account_organization_id_fkey`;
-- ALTER TABLE `account` DROP COLUMN `organization_id`, DROP COLUMN `role`;
-- DROP TABLE `account_snapshot`;
-- DROP TABLE `join_request`;
-- DROP TABLE `student_group`;
-- DROP TABLE `organization`;
-- DROP TABLE `church`;
-- DROP TABLE `parish`;

-- ============================================================
-- Notes:
-- - 신규 컬럼은 모두 nullable로 추가 (Phase D 데이터 마이그레이션 후 NOT NULL 전환)
-- - 기존 컬럼(account_id, group_id)은 유지 (Phase D에서 데이터 이관 후 제거)
-- - Parish 시드: 16개 한국 가톨릭 교구 (마스터 데이터)
-- - 적용: pnpm --filter @school/api prisma db push
-- ============================================================
