/**
 * getOrganizationLabels 테스트 — ORGANIZATION_TYPE → 라벨 분기 + 안전 fallback 검증
 *
 * 배경: docs/specs/functional-design/young-adult-wording.md
 */
import { ORGANIZATION_LABELS_DEFAULT, ORGANIZATION_LABELS_YOUNG_ADULT, getOrganizationLabels } from '@school/shared';
import { describe, expect, it } from 'vitest';

describe('getOrganizationLabels', () => {
    it('ELEMENTARY 입력 시 학년/학생 기본 라벨을 반환한다', () => {
        expect(getOrganizationLabels('ELEMENTARY')).toEqual(ORGANIZATION_LABELS_DEFAULT);
    });

    it('MIDDLE_HIGH 입력 시 학년/학생 기본 라벨을 반환한다', () => {
        expect(getOrganizationLabels('MIDDLE_HIGH')).toEqual(ORGANIZATION_LABELS_DEFAULT);
    });

    it('YOUNG_ADULT 입력 시 그룹/멤버 라벨을 반환한다', () => {
        const labels = getOrganizationLabels('YOUNG_ADULT');
        expect(labels).toEqual(ORGANIZATION_LABELS_YOUNG_ADULT);
        expect(labels.group).toBe('그룹');
        expect(labels.member).toBe('멤버');
        expect(labels.groupAndDepartment).toBe('그룹&부서');
    });

    it('null 입력 시 기본 라벨로 안전 fallback한다', () => {
        expect(getOrganizationLabels(null)).toEqual(ORGANIZATION_LABELS_DEFAULT);
    });

    it('undefined 입력 시 기본 라벨로 안전 fallback한다', () => {
        expect(getOrganizationLabels(undefined)).toEqual(ORGANIZATION_LABELS_DEFAULT);
    });

    it('알 수 없는 string 입력 시 기본 라벨로 안전 fallback한다', () => {
        expect(getOrganizationLabels('UNKNOWN_TYPE')).toEqual(ORGANIZATION_LABELS_DEFAULT);
        expect(getOrganizationLabels('')).toEqual(ORGANIZATION_LABELS_DEFAULT);
    });

    it('기본 라벨은 학년/학생/학년&부서 형식이다', () => {
        expect(ORGANIZATION_LABELS_DEFAULT.group).toBe('학년');
        expect(ORGANIZATION_LABELS_DEFAULT.member).toBe('학생');
        expect(ORGANIZATION_LABELS_DEFAULT.groupAndDepartment).toBe('학년&부서');
    });
});
