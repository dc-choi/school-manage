/**
 * 이탈 감지 UseCase 단위 테스트
 *
 * 2026년 기준:
 * - 부활 대축일: 4/5 (일)
 * - 성주간: 3/29 (주님 수난 성지주일) ~ 4/4 (성토요일)
 */
import { mockPrismaClient } from '../vitest.setup.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetectChurnUseCase } from '~/domains/churn/application/detect-churn.usecase.js';

describe('DetectChurnUseCase', () => {
    let usecase: DetectChurnUseCase;

    beforeEach(() => {
        usecase = new DetectChurnUseCase();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('isHolyWeek', () => {
        it('성주간 시작일(3/29)이면 true', () => {
            const date = new Date(2026, 2, 29); // 3/29
            expect(usecase.isHolyWeek(date, 2026)).toBe(true);
        });

        it('성토요일(4/4)이면 true', () => {
            const date = new Date(2026, 3, 4); // 4/4
            expect(usecase.isHolyWeek(date, 2026)).toBe(true);
        });

        it('성주간 중간(4/1)이면 true', () => {
            const date = new Date(2026, 3, 1); // 4/1
            expect(usecase.isHolyWeek(date, 2026)).toBe(true);
        });

        it('부활 대축일(4/5)이면 false', () => {
            const date = new Date(2026, 3, 5); // 4/5
            expect(usecase.isHolyWeek(date, 2026)).toBe(false);
        });

        it('성주간 전날(3/28)이면 false', () => {
            const date = new Date(2026, 2, 28); // 3/28
            expect(usecase.isHolyWeek(date, 2026)).toBe(false);
        });

        it('일반 날짜(3/17)이면 false', () => {
            const date = new Date(2026, 2, 17); // 3/17
            expect(usecase.isHolyWeek(date, 2026)).toBe(false);
        });
    });

    describe('execute', () => {
        it('성주간이면 스킵한다', async () => {
            // 2026-04-01 (성주간 수요일) 09:00 KST = 2026-04-01 00:00 UTC
            vi.setSystemTime(new Date(2026, 3, 1, 0, 0, 0));

            const result = await usecase.execute();

            expect(result.skipped).toBe(true);
            expect(result.skipReason).toBe('성주간');
            expect(result.alerts).toHaveLength(0);
        });

        it('14일 미활동 단체를 감지한다', async () => {
            // 2026-03-17 09:00 KST
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 미활동 단체 2곳 (마지막 출석 20일 전, 14일 전)
            mockPrismaClient.$kysely._executeResults.push([
                { organizationId: 1n, lastDate: '20260225' }, // 20일 전
                { organizationId: 2n, lastDate: '20260303' }, // 14일 전
            ]);

            // 중복 알림 없음
            mockPrismaClient.churnAlertLog.findMany.mockResolvedValueOnce([]);

            // 단체 상세
            mockPrismaClient.organization.findMany.mockResolvedValueOnce([
                {
                    id: 1n,
                    name: '중고등부',
                    church: { name: '흑석동' },
                    _count: { students: 10 },
                },
                {
                    id: 2n,
                    name: '초등부',
                    church: { name: 'A본당' },
                    _count: { students: 5 },
                },
            ]);

            const result = await usecase.execute();

            expect(result.skipped).toBe(false);
            expect(result.alerts).toHaveLength(2);
            // 미활동 일수 내림차순 정렬
            expect(result.alerts[0].churchName).toBe('흑석동');
            expect(result.alerts[0].inactiveDays).toBe(20);
            expect(result.alerts[1].churchName).toBe('A본당');
            expect(result.alerts[1].inactiveDays).toBe(14);
        });

        it('모든 단체 활성이면 빈 결과', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 미활동 단체 없음
            mockPrismaClient.$kysely._executeResults.push([]);

            const result = await usecase.execute();

            expect(result.skipped).toBe(false);
            expect(result.alerts).toHaveLength(0);
        });

        it('7일 내 기알림 단체를 제외한다', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 미활동 단체 2곳
            mockPrismaClient.$kysely._executeResults.push([
                { organizationId: 1n, lastDate: '20260225' },
                { organizationId: 2n, lastDate: '20260225' },
            ]);

            // 1곳은 이미 알림됨
            mockPrismaClient.churnAlertLog.findMany.mockResolvedValueOnce([{ organizationId: 1n }]);

            // 남은 1곳 상세
            mockPrismaClient.organization.findMany.mockResolvedValueOnce([
                {
                    id: 2n,
                    name: '초등부',
                    church: { name: 'B본당' },
                    _count: { students: 8 },
                },
            ]);

            const result = await usecase.execute();

            expect(result.alerts).toHaveLength(1);
            expect(result.alerts[0].churchName).toBe('B본당');
        });

        it('출석 0건 단체는 쿼리에서 제외된다', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // HAVING COUNT >= 1 이므로 0건 단체는 Kysely 쿼리에서 이미 제외
            mockPrismaClient.$kysely._executeResults.push([]);

            const result = await usecase.execute();

            expect(result.alerts).toHaveLength(0);
        });
    });
});
