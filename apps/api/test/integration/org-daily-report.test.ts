/**
 * 조직 현황 일일 보고서 UseCase 통합 테스트 (실제 DB)
 */
import { type SeedBase, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { getNowKST } from '@school/utils';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgDailyReportUseCase } from '~/domains/report/application/org-daily-report.usecase.js';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;
let usecase: OrgDailyReportUseCase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
    usecase = new OrgDailyReportUseCase();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

afterAll(async () => {
    await truncateAll();
});

describe('OrgDailyReportUseCase', () => {
    it('조직 활성화 현황과 계정 현황을 조회한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0)); // 2026-03-17 15:00 KST

        const now = getNowKST();

        // 그룹 생성
        const group = await database.group.create({
            data: {
                name: '1반',
                type: 'GRADE',
                organizationId: seed.org.id,
                createdAt: now,
            },
        });

        // 학생 생성
        const student = await database.student.create({
            data: {
                societyName: '홍길동',
                organizationId: seed.org.id,
                createdAt: now,
            },
        });

        // 출석 생성
        await database.attendance.create({
            data: {
                studentId: student.id,
                groupId: group.id,
                date: '20260316',
                content: '◎',
                createdAt: now,
            },
        });

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(1);
        expect(result.activityRows[0].churchName).toBe('장위동성당');
        expect(result.activityRows[0].organizationName).toBe('장위동 중고등부');
        expect(Number(result.activityRows[0].studentCount)).toBe(1);
        expect(Number(result.activityRows[0].attendanceCount)).toBe(1);
        expect(Number(result.activityRows[0].groupCount)).toBe(1);

        expect(result.accountRows).toHaveLength(1);
        expect(Number(result.accountRows[0].totalAccounts)).toBe(1);
        expect(result.accountRows[0].accountNames).toContain(seed.account.displayName);
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0));

        // seed에서 생성된 계정이 있으므로 accountRows는 비어있지 않을 수 있음
        // 모든 데이터를 삭제하고 다시 시작
        await truncateAll();

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(0);
        expect(result.accountRows).toHaveLength(0);
    });

    it('여러 조직의 데이터를 반환한다', async () => {
        vi.setSystemTime(new Date(2026, 2, 17, 6, 0, 0));

        const now = getNowKST();

        // 두 번째 본당 + 조직 생성
        const church2 = await database.church.create({
            data: {
                name: '가재울성당',
                parishId: seed.parish.id,
                createdAt: now,
            },
        });

        const org2 = await database.organization.create({
            data: {
                name: '초등부',
                type: 'ELEMENTARY',
                churchId: church2.id,
                createdAt: now,
            },
        });

        const account2 = await database.account.create({
            data: {
                name: '초등부',
                displayName: '박지훈',
                password: TEST_PASSWORD_HASH,
                organizationId: org2.id,
                role: 'ADMIN',
                createdAt: now,
                privacyAgreedAt: now,
            },
        });

        // 첫 번째 조직 데이터
        const group1 = await database.group.create({
            data: {
                name: '1반',
                type: 'GRADE',
                organizationId: seed.org.id,
                createdAt: now,
            },
        });

        const student1 = await database.student.create({
            data: {
                societyName: '학생1',
                organizationId: seed.org.id,
                createdAt: now,
            },
        });

        await database.attendance.create({
            data: {
                studentId: student1.id,
                groupId: group1.id,
                date: '20260316',
                content: '◎',
                createdAt: now,
            },
        });

        // 두 번째 조직 데이터
        const group2 = await database.group.create({
            data: {
                name: '1반',
                type: 'GRADE',
                organizationId: org2.id,
                createdAt: now,
            },
        });

        const student2 = await database.student.create({
            data: {
                societyName: '학생2',
                organizationId: org2.id,
                createdAt: now,
            },
        });

        await database.attendance.create({
            data: {
                studentId: student2.id,
                groupId: group2.id,
                date: '20260316',
                content: '○',
                createdAt: now,
            },
        });

        const result = await usecase.execute();

        expect(result.activityRows).toHaveLength(2);
        expect(result.accountRows).toHaveLength(2);

        // 두 조직 모두 포함되어 있는지 확인
        const churchNames = result.activityRows.map((r) => r.churchName);
        expect(churchNames).toContain('장위동성당');
        expect(churchNames).toContain('가재울성당');

        const accountChurchNames = result.accountRows.map((r) => r.churchName);
        expect(accountChurchNames).toContain('장위동성당');
        expect(accountChurchNames).toContain('가재울성당');
    });
});
