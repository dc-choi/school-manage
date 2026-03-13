-- 학년/부서 두 축 그룹핑 마이그레이션
-- PRD: docs/specs/prd/dual-axis-grouping.md

-- 1. Group에 type 컬럼 추가 (기본값 GRADE)
ALTER TABLE `group` ADD COLUMN `type` VARCHAR(20) NOT NULL DEFAULT 'GRADE';

-- 2. Student에 organization_id 컬럼 추가
ALTER TABLE `student` ADD COLUMN `organization_id` BIGINT NULL;

-- 3. 기존 데이터 마이그레이션: group_id가 아직 있으므로 직접 조인하여 organization_id 채우기
UPDATE `student` s
INNER JOIN `group` g ON s.group_id = g._id
SET s.organization_id = g.organization_id
WHERE s.organization_id IS NULL;

-- 4. organization_id 인덱스 + FK 추가
CREATE INDEX `student_organization_id_idx` ON `student`(`organization_id`);
ALTER TABLE `student` ADD CONSTRAINT `student_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organization`(`_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. 검증: 모든 Student가 StudentGroup에 매핑되어 있는지 확인
-- 아래 쿼리 결과가 0건이어야 안전하게 group_id 제거 가능
-- SELECT s._id, s.society_name
-- FROM student s
-- LEFT JOIN student_group sg ON s._id = sg.student_id
-- WHERE sg._id IS NULL AND s.delete_at IS NULL;

-- 6. Student에서 group_id FK 및 인덱스 제거
ALTER TABLE `student` DROP FOREIGN KEY `student_group_id_fkey`;
ALTER TABLE `student` DROP INDEX `student_group_id_fkey`;
ALTER TABLE `student` DROP COLUMN `group_id`;
