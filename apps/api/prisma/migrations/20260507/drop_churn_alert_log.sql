-- Migration: churn_alert_log 테이블 삭제
-- Date: 2026-05-07
-- Feature: daily-report-social-proof
-- Description: 09:00 cron(이탈 감지 알림) 폐지에 따라 ChurnAlertLog 모델 + 관련 도메인 코드를 삭제한다.
--              발송 이력은 보존 가치가 없으므로 테이블 자체를 DROP한다.

-- ────────────────────────────────────────────────────────────────────
-- Pre-flight (운영 적용 전 확인)
-- ────────────────────────────────────────────────────────────────────
--
-- 외래키: organization(_id) ← churn_alert_log(organization_id) 단방향이므로 부모 테이블 영향 없음.
-- 발송 이력 보존이 필요하면 적용 전 백업:
--   $ mysqldump -u <user> -p school_back churn_alert_log \
--       > backup_churn_alert_log_$(date +%Y%m%d_%H%M%S).sql

-- ────────────────────────────────────────────────────────────────────
-- Up Migration
-- ────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `churn_alert_log`;

-- ────────────────────────────────────────────────────────────────────
-- Down Migration (rollback)
-- ────────────────────────────────────────────────────────────────────
-- 참고용 SQL (실행 금지 — 데이터 복원은 백업 파일에서만 가능):
-- CREATE TABLE `churn_alert_log` (
--     `_id` BIGINT NOT NULL AUTO_INCREMENT,
--     `organization_id` BIGINT NOT NULL,
--     `inactive_days` INT NOT NULL,
--     `sent_at` DATETIME(3) NOT NULL,
--     PRIMARY KEY (`_id`),
--     INDEX `churn_alert_log_organization_id_sent_at_idx`(`organization_id`, `sent_at`),
--     CONSTRAINT `churn_alert_log_organization_id_fkey`
--         FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
--         ON DELETE CASCADE ON UPDATE CASCADE
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────
-- Notes
-- ────────────────────────────────────────────────────────────────────
-- - 데이터 손실: 발송 이력 전부 사라짐. 관련 PRD에서 보존 가치 없음으로 결정 (docs/specs/prd/daily-report-social-proof.md)
-- - 기존 마이그레이션 파일 `apps/api/prisma/migrations/20260317/churn_alert_log.sql`은 적용 이력 보존 차원에서 삭제하지 않는다.
