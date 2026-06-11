-- Migration: 미소속 계정 잔존 role 정리 (data-only)
-- Date: 2026-06-11
-- Feature: A-4 겸직 모델 검토 종결 — 계정/조직 라이프사이클 정합화 (account-multi-membership)
-- Description:
--   도메인 불변식 "미소속(organization_id IS NULL) 계정은 role도 NULL"의 데이터 정합화.
--   탈퇴(delete-account.usecase.ts)가 organization_id만 NULL 처리하고 role을 남겨,
--   탈퇴 계정과 탈퇴 후 복원 계정(restoreAccount는 deletedAt만 해제, 조직 미복원)이
--   "role 있음 + 조직 없음" 모순 상태로 잔존했다 (강퇴 remove-member는 org/role 쌍 해제로 정상).
--   코드 수정(탈퇴 두 경로에 role: null 추가)과 함께 기존 모순 데이터를 일괄 정리한다.
--   스키마(DDL) 변경 없음 — 데이터 정리 전용.

-- Up Migration
UPDATE `account` SET `role` = NULL WHERE `organization_id` IS NULL AND `role` IS NOT NULL;

-- Down Migration (rollback)
-- 불가 (정리 전 role 값을 보존하지 않음). 해당 상태는 도메인 불변식 위반이라 롤백 자체가 무의미.

-- Notes:
-- - 안전 근거: "미소속 + role 보유" 상태에 도달하는 정상 경로 없음 — 소속/역할은
--   approve-join, create-organization이 쌍으로 설정하고 remove-member, delete-account가 쌍으로 해제.
--   탈퇴/복원 잔존분만 해당 조건에 매칭된다.
-- - update_at은 의도적으로 미갱신 — 시스템 정정이므로 사용자 행위 시각 이력을 보존한다.
-- - 멱등: 재실행 시 영향 행 0건 (조건이 모순 행만 매칭).
-- - 적용 전 사전 확인: SELECT COUNT(*) FROM account WHERE deleted_at IS NOT NULL AND organization_id IS NOT NULL AND role IS NOT NULL; → 0
--   (소속을 유지한 채 탈퇴된 비정상 복합 케이스 — 본 UPDATE 대상이 아니므로 존재 시 적용 전 별도 조사)
-- - 검증: SELECT COUNT(*) FROM account WHERE organization_id IS NULL AND role IS NOT NULL; → 0
-- - prisma db push 불필요 (스키마 무변경). 로컬/운영 DB에 이 UPDATE를 1회 수동 적용.
--   테스트 DB는 무관 (vitest.global-setup.ts force-reset + 코드 수정분으로 검증).
