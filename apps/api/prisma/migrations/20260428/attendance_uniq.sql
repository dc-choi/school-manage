-- Migration: Replace (student_id, date) index with UNIQUE constraint
-- Date: 2026-04-28
-- Feature: attendance-uniq (BUGFIX P3)
-- Description: Block cross-session race condition that allows duplicate (student_id, date) rows in attendance table.

-- Pre-check (run on production before applying):
--   SELECT student_id, `date`, COUNT(*) AS cnt
--   FROM attendance
--   GROUP BY student_id, `date`
--   HAVING cnt > 1;
-- Expected: 0 rows. If any rows returned, run cleanup SQL from
-- docs/specs/prd/attendance-uniq-migration.md before applying this migration.

-- Up Migration
-- Single ALTER TABLE to drop the existing index and add UNIQUE atomically (no race window between DROP and ADD).
ALTER TABLE `attendance`
    DROP INDEX `attendance_student_id_date_idx`,
    ADD UNIQUE KEY `attendance_student_date_unique` (`student_id`, `date`);

-- Down Migration (rollback)
-- ALTER TABLE `attendance`
--     DROP INDEX `attendance_student_date_unique`,
--     ADD INDEX `attendance_student_id_date_idx` (`student_id`, `date`);

-- Notes:
-- - Replaces the regular index added in 20260425/add_attendance_indexes.sql with UNIQUE.
-- - UNIQUE also serves as an index, so calendar/day-detail/auto-save query plans remain unchanged.
-- - (group_id, date) index from 20260425 is unaffected.
-- - MySQL UNIQUE allows multiple NULLs, but `date` is always populated by getFullTime(year, month, day),
--   so NULL rows do not exist in practice.
-- - Online DDL (ALGORITHM=INPLACE, LOCK=NONE) supported on MySQL 8.x for both DROP INDEX and ADD UNIQUE
--   when no duplicates exist; locking is negligible for ~11k rows.
-- - Optional online DDL hint (운영자 판단): append `, ALGORITHM=INPLACE, LOCK=NONE` to the ALTER TABLE.
--   Falls back to COPY+TABLE-LOCK if InnoDB cannot apply INPLACE (e.g., when duplicates exist).
-- - Application layer: update-attendance.usecase.ts switches from findFirst→create/updateMany to
--   atomic Kysely `INSERT ... ON DUPLICATE KEY UPDATE` (groupId 보존: UPDATE 절에 미포함).
