-- Migration: Student (organization_id, delete_at) 복합 인덱스 추가
-- Date: 2026-04-30
-- Feature: student-duplicate-check (로드맵 2단계 — 학생 등록 중복 확인 후속)
-- Description: 중복 검출 시 fetchCandidates의 WHERE 조건은 (organizationId, deletedAt: null).
--   기존 단일 인덱스 (organization_id)만으로는 deleted_at 필터링이 인덱스 스캔 후
--   힙 재조회를 강제하므로, 복합 인덱스를 추가해 활성 학생 조회를 단일 인덱스 스캔으로 처리한다.
--   조직당 학생 ≤500 가정에서는 즉각 효과 미미하나, 누적 삭제 비율 증가 시 유효.

-- Pre-check (운영 적용 전):
--   SHOW INDEX FROM student WHERE Key_name LIKE '%organization%';
-- Expected: 기존 student_organization_id_idx 1건만 존재.

-- Up Migration
CREATE INDEX `student_organization_id_delete_at_idx`
ON `student` (`organization_id`, `delete_at`);

-- Down Migration (rollback)
-- DROP INDEX `student_organization_id_delete_at_idx` ON `student`;

-- Notes:
-- - MySQL InnoDB 기본 online DDL 지원 (LOCK=NONE, ALGORITHM=INPLACE) — 학생 ~2,700행 수준에서 1초 미만.
-- - Prisma의 `@@index([organizationId, deletedAt])` 명명 규칙과 일치하므로 db push와 충돌 없음.
-- - 기존 `student_organization_id_idx`는 유지 (organizationId 단독 조회 경로 보호).
