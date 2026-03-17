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
                churchName: '장위동',
                organizationName: '중고등부',
                organizationType: 'MIDDLE_HIGH',
                groupCount: 3n,
                studentCount: 54n,
                attendanceCount: 2961n,
                recentGroupCreateAt: new Date('2025-09-01'),
                recentStudentCreateAt: new Date('2026-03-10'),
                recentAttendanceAt: new Date('2026-03-16'),
            },
        ]);

        // 두 번째 $kysely.execute: 조직별 계정 현황
        mockPrismaClient.$kysely._executeResults.push([
            {
                churchName: '장위동',
                organizationName: '중고등부',
                organizationType: 'MIDDLE_HIGH',
                totalAccounts: 3n,
                accountNames: '홍길동, 김철수, 이영희',
            },
        ]);

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(1);
        expect(result.activityRows[0].churchName).toBe('장위동');
        expect(result.activityRows[0].studentCount).toBe(54n);
        expect(result.activityRows[0].attendanceCount).toBe(2961n);

        expect(result.accountRows).toHaveLength(1);
        expect(result.accountRows[0].totalAccounts).toBe(3n);
        expect(result.accountRows[0].accountNames).toBe('홍길동, 김철수, 이영희');
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
                churchName: '장위동',
                organizationName: '중고등부',
                organizationType: 'MIDDLE_HIGH',
                groupCount: 3n,
                studentCount: 54n,
                attendanceCount: 2961n,
                recentGroupCreateAt: new Date('2025-09-01'),
                recentStudentCreateAt: new Date('2026-03-10'),
                recentAttendanceAt: new Date('2026-03-16'),
            },
            {
                churchName: '가재울',
                organizationName: '초등부',
                organizationType: 'ELEMENTARY',
                groupCount: 5n,
                studentCount: 131n,
                attendanceCount: 207n,
                recentGroupCreateAt: new Date('2026-01-15'),
                recentStudentCreateAt: new Date('2026-03-14'),
                recentAttendanceAt: new Date('2026-03-16'),
            },
        ]);

        mockPrismaClient.$kysely._executeResults.push([
            {
                churchName: '장위동',
                organizationName: '중고등부',
                organizationType: 'MIDDLE_HIGH',
                totalAccounts: 3n,
                accountNames: '홍길동, 김철수, 이영희',
            },
            {
                churchName: '가재울',
                organizationName: '초등부',
                organizationType: 'ELEMENTARY',
                totalAccounts: 1n,
                accountNames: '박지훈',
            },
        ]);

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(2);
        expect(result.accountRows).toHaveLength(2);
        expect(result.activityRows[1].churchName).toBe('가재울');
        expect(result.accountRows[1].accountNames).toBe('박지훈');
    });
});
