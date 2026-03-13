-- 졸업일 정규화 + Organization.type 추가
-- PRD: docs/specs/prd/graduation-normalization.md

-- 1. Organization에 type 컬럼 추가 (NOT NULL, 기본값 MIDDLE_HIGH)
ALTER TABLE organization ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'MIDDLE_HIGH';

-- 2. 기존 graduatedAt 정규화 (클릭 시점 → 해당 연도 12/31 00:00:00)
UPDATE student
SET graduated_at = CONCAT(YEAR(graduated_at), '-12-31 00:00:00')
WHERE graduated_at IS NOT NULL;
