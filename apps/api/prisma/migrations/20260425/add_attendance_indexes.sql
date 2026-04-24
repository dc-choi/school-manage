-- Migration: Add composite indexes to attendance
-- Date: 2026-04-25
-- Feature: attendance-index (P2 BUGFIX — Attendance 테이블 인덱스 누락)
-- Description:
--   attendance 테이블은 보조 인덱스가 전혀 없어 캘린더·일상세·자동저장·통계 쿼리가
--   풀테이블 스캔으로 동작한다. 장기 성장(MAO 50→200곳) 대비 복합 인덱스 2개 선제 도입.
--   - (student_id, date): get-calendar / get-day-detail / update-attendance 커버
--   - (group_id, date): get-attendance-rate / get-group-statistics / get-top-groups 커버
--   설계: `docs/specs/functional-design/attendance-index.md` (6단계에서 삭제 예정)

-- Up Migration
CREATE INDEX `attendance_student_id_date_idx` ON `attendance` (`student_id`, `date`);
CREATE INDEX `attendance_group_id_date_idx`   ON `attendance` (`group_id`,   `date`);

-- Down Migration (rollback)
-- DROP INDEX `attendance_student_id_date_idx` ON `attendance`;
-- DROP INDEX `attendance_group_id_date_idx`   ON `attendance`;

-- Notes:
-- - MySQL 5.6+ 기본 online DDL (ALGORITHM=INPLACE, LOCK=NONE) 지원 → 쓰기 차단 없음
-- - 현재 테이블 크기 10,561 건 (2026-04-24 기준) → 락 영향 무시 가능
-- - Leftmost prefix 규칙: student_id 단독 조건도 적중, date 단독은 불적중 (설계 의도)
-- - deletedAt IS NULL 필터는 인덱스 비포함 (MariaDB/MySQL partial index 미지원)
--   → EXPLAIN Extra에 "Using where" 표시되나 key 선택은 유지
-- - YAGNI: (group_id, student_id, date) 성별 통계 커버링은 차후 병목 확인 시 추가
