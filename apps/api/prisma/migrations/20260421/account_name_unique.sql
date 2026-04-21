-- Migration: Add UNIQUE constraint to account.name
-- Date: 2026-04-21
-- Feature: account-name-unique (BUGFIX P1)
-- Description: Prevent signup race condition and deleted-account name reuse collision with restoreAccount flow.

-- Apply order: cleanup_duplicate_account_names.sql 먼저 적용 → 이 파일.
-- Pre-check (cleanup 후 0건 확인):
--   SELECT LOWER(name) AS lname, COUNT(*) AS cnt
--   FROM account
--   GROUP BY lname
--   HAVING cnt > 1;

-- Up Migration
ALTER TABLE `account` ADD UNIQUE KEY `account_name_key` (`name`);

-- Down Migration (rollback)
-- ALTER TABLE `account` DROP KEY `account_name_key`;

-- Notes:
-- - Applies to ALL accounts (active + soft-deleted) to preserve restoreAccount name reservation.
-- - account 테이블 collation은 utf8mb4_unicode_ci (case- and accent-insensitive) 이므로 'alice' vs 'Alice'도 UNIQUE 위반.
-- - Small DB size (~259 accounts as of 2026-04-20), so index creation lock is negligible.
