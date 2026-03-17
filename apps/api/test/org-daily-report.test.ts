/**
 * 조직 현황 일일 보고서 UseCase 단위 테스트
 */
import { mockPrismaClient } from '../vitest.setup.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgDailyReportUseCase } from '~/domains/report/application/org-daily-report.usecase.js';

describe('OrgDailyReportUseCase', () => {
    let usecase: OrgDailyReportUseCase;

    beforeEach(() => {
        usecase = new OrgDailyReportUseCase();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('조직 활성화 현황과 계정 현황을 조회한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0)); // 2026-03-17 15:00 KST

        // 첫 번째 $kysely.execute: 조직 활성화 현황
        mockPrismaClient.$kysely._executeResults.push([
            {
                church_name: '장위동',
                organization_name: '중고등부',
                organization_type: 'MIDDLE_HIGH',
                group_count: 3n,
                student_count: 54n,
                attendance_count: 2961n,
                recent_group_create_at: new Date('2025-09-01'),
                recent_student_create_at: new Date('2026-03-10'),
                recent_attendance_at: new Date('2026-03-16'),
            },
        ]);

        // 두 번째 $kysely.execute: 조직별 계정 현황
        mockPrismaClient.$kysely._executeResults.push([
            {
                church_name: '장위동',
                organization_name: '중고등부',
                organization_type: 'MIDDLE_HIGH',
                total_accounts: 3n,
                account_names: '홍길동, 김철수, 이영희',
            },
        ]);

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(1);
        expect(result.activityRows[0].church_name).toBe('장위동');
        expect(result.activityRows[0].student_count).toBe(54n);
        expect(result.activityRows[0].attendance_count).toBe(2961n);

        expect(result.accountRows).toHaveLength(1);
        expect(result.accountRows[0].total_accounts).toBe(3n);
        expect(result.accountRows[0].account_names).toBe('홍길동, 김철수, 이영희');
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0));

        mockPrismaClient.$kysely._executeResults.push([]);
        mockPrismaClient.$kysely._executeResults.push([]);

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(0);
        expect(result.accountRows).toHaveLength(0);
    });

    it('여러 조직의 데이터를 반환한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0));

        mockPrismaClient.$kysely._executeResults.push([
            {
                church_name: '장위동',
                organization_name: '중고등부',
                organization_type: 'MIDDLE_HIGH',
                group_count: 3n,
                student_count: 54n,
                attendance_count: 2961n,
                recent_group_create_at: new Date('2025-09-01'),
                recent_student_create_at: new Date('2026-03-10'),
                recent_attendance_at: new Date('2026-03-16'),
            },
            {
                church_name: '가재울',
                organization_name: '초등부',
                organization_type: 'ELEMENTARY',
                group_count: 5n,
                student_count: 131n,
                attendance_count: 207n,
                recent_group_create_at: new Date('2026-01-15'),
                recent_student_create_at: new Date('2026-03-14'),
                recent_attendance_at: new Date('2026-03-16'),
            },
        ]);

        mockPrismaClient.$kysely._executeResults.push([
            {
                church_name: '장위동',
                organization_name: '중고등부',
                organization_type: 'MIDDLE_HIGH',
                total_accounts: 3n,
                account_names: '홍길동, 김철수, 이영희',
            },
            {
                church_name: '가재울',
                organization_name: '초등부',
                organization_type: 'ELEMENTARY',
                total_accounts: 1n,
                account_names: '박지훈',
            },
        ]);

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(2);
        expect(result.accountRows).toHaveLength(2);
        expect(result.activityRows[1].church_name).toBe('가재울');
        expect(result.accountRows[1].account_names).toBe('박지훈');
    });
});
