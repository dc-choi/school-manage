-- Migration: Cleanup abnormal attendance.content marks
-- Date: 2026-04-28
-- Feature: attendance-mark-fix (BUGFIX P3, /sdd non-func)
-- Description: One-shot DML to reconcile 44 production rows whose content violates the
--   strict whitelist enforced by attendance.update Zod schema (`/^[◎○△\-]*$/.max(10)`,
--   applied 2026-04-24). New writes are already rejected; this migration cleans the
--   pre-existing data only.

-- Pre-check (run on production before applying):
--   SELECT content, CHAR_LENGTH(content) AS char_len, HEX(content) AS hex, COUNT(*) AS cnt
--   FROM attendance
--   WHERE delete_at IS NULL
--     AND content NOT IN ('', '◎', '○', '△', '-')
--   GROUP BY content, char_len, hex
--   ORDER BY cnt DESC;
-- Expected (2026-04-28 snapshot, 44 rows total):
--   '○ ' (E2978B 20)            : 25
--   '◎ ' (E2978E 20)            : 12
--   ' '  (20)                   :  2
--   '○○' (E2978B E2978B)        :  2
--   '◎◎' (E2978E E2978E)        :  1
--   '△ 결석=미 표기' (free-text) :  1
--   '.○' (2E E2978B)            :  1

-- Up Migration
-- Per-step ROW_COUNT() output and an in-transaction post-check act as silent-failure
-- guards. Operators MUST inspect each *_affected value vs. the Expected comment, and
-- the final remaining_abnormal MUST equal 0. If any value diverges, run `ROLLBACK;`
-- before the COMMIT line and investigate.
START TRANSACTION;

-- (1) Trailing-space marks → trim. Expected: 37 rows (○+space: 25, ◎+space: 12).
UPDATE `attendance`
SET `content` = TRIM(`content`)
WHERE `delete_at` IS NULL
  AND `content` IN ('○ ', '◎ ');
SELECT ROW_COUNT() AS step1_trim_affected;

-- (2) Duplicate marks → single mark. Expected: 2 + 1 = 3 rows total.
UPDATE `attendance`
SET `content` = '○'
WHERE `delete_at` IS NULL
  AND `content` = '○○';
SELECT ROW_COUNT() AS step2a_double_o_affected;

UPDATE `attendance`
SET `content` = '◎'
WHERE `delete_at` IS NULL
  AND `content` = '◎◎';
SELECT ROW_COUNT() AS step2b_double_double_circle_affected;

-- (3) Whitespace-only rows → physical delete. Expected: 2 rows.
-- Rationale: domain policy stores empty values as deleted rows (auto-save isFull=false
-- physically deletes when content is empty). Updating to '' would leak inconsistent
-- empty rows into the dataset.
DELETE FROM `attendance`
WHERE `delete_at` IS NULL
  AND `content` = ' ';
SELECT ROW_COUNT() AS step3_whitespace_deleted;

-- (4) Free-text rows → extract intended mark. Expected: 1 row each.
UPDATE `attendance`
SET `content` = '△'
WHERE `delete_at` IS NULL
  AND `content` = '△ 결석=미 표기';
SELECT ROW_COUNT() AS step4a_freetext_triangle_affected;

UPDATE `attendance`
SET `content` = '○'
WHERE `delete_at` IS NULL
  AND `content` = '.○';
SELECT ROW_COUNT() AS step4b_dot_o_affected;

-- In-transaction post-check. MUST be 0 before COMMIT.
SELECT COUNT(*) AS remaining_abnormal
FROM `attendance`
WHERE `delete_at` IS NULL
  AND `content` NOT IN ('', '◎', '○', '△', '-');

COMMIT;

-- Post-check (run on production after applying):
--   SELECT COUNT(*) AS remaining_abnormal
--   FROM attendance
--   WHERE delete_at IS NULL
--     AND content NOT IN ('', '◎', '○', '△', '-');
-- Expected: 0

-- Down Migration (rollback)
-- Not reversible: the migration normalizes/deletes abnormal data. To undo, restore
-- attendance table from a pre-migration backup snapshot, or pre-save the affected
-- (id, content) pairs before applying this script.

-- Notes:
-- - Equality-only matching (no LIKE/REGEXP) blocks unintended row mutation.
-- - `delete_at IS NULL` is defensive; attendance currently uses physical delete only.
-- - Equality on multibyte UTF-8 strings is safe under utf8mb4 collation.
-- - Total: 42 UPDATE + 2 DELETE = 44 rows affected. Lock window is negligible vs.
--   the ~11k-row attendance table.
-- - Does not alter (student_id, date) UNIQUE constraint or (group_id, date) index.
