/**
 * 이탈 감지 UseCase 통합 테스트 (실제 DB)
 *
 * 2026년 기준:
 * - 부활 대축일: 4/5 (일)
 * - 성주간: 3/29 (주님 수난 성지주일) ~ 4/4 (성토요일)
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { getNowKST } from '@school/utils';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetectChurnUseCase } from '~/domains/churn/application/detect-churn.usecase.js';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;
let usecase: DetectChurnUseCase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
    usecase = new DetectChurnUseCase();
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

afterAll(async () => {
    await truncateAll();
});

/**
 * 학생 + 출석 데이터를 생성하는 헬퍼
 * 반환: 생성된 student
 */
async function createStudentWithAttendance(orgId: bigint, attendanceDates: string[]) {
    const now = getNowKST();

    const student = await database.student.create({
        data: {
            societyName: '테스트학생',
            organizationId: orgId,
            createdAt: now,
        },
    });

    for (const date of attendanceDates) {
        await database.attendance.create({
            data: {
                studentId: student.id,
                date,
                content: '◎',
                createdAt: now,
            },
        });
    }

    return student;
}

/**
 * 추가 조직을 생성하는 헬퍼 (church는 seed에서 재활용 가능)
 */
async function createOrganization(churchId: bigint, name: string, opts?: { churchName?: string }) {
    const now = getNowKST();

    let church;
    if (opts?.churchName) {
        church = await database.church.create({
            data: {
                name: opts.churchName,
                parishId: (await database.parish.findFirst())!.id,
                createdAt: now,
            },
        });
    }

    const org = await database.organization.create({
        data: {
            name,
            type: 'MIDDLE_HIGH',
            churchId: church?.id ?? churchId,
            createdAt: now,
        },
    });

    return org;
}

describe('DetectChurnUseCase', () => {
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

            // seed의 기본 org: 마지막 출석 20일 전 (02/25)
            await createStudentWithAttendance(seed.org.id, ['20260225']);

            // 추가 조직: 마지막 출석 15일 전 (03/02)
            // 쿼리가 HAVING max(date) < thresholdDate (strict <) 이므로
            // threshold(03/03) 미만인 03/02가 감지 대상
            const org2 = await createOrganization(seed.church.id, '초등부', { churchName: 'A본당' });
            await createStudentWithAttendance(org2.id, ['20260302']);

            const result = await usecase.execute();

            expect(result.skipped).toBe(false);
            expect(result.alerts).toHaveLength(2);
            // 미활동 일수 내림차순 정렬
            expect(result.alerts[0].inactiveDays).toBe(20);
            expect(result.alerts[1].inactiveDays).toBe(15);
        });

        it('모든 단체 활성이면 빈 결과', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 오늘 출석 기록이 있으면 미활동 아님
            await createStudentWithAttendance(seed.org.id, ['20260317']);

            const result = await usecase.execute();

            expect(result.skipped).toBe(false);
            expect(result.alerts).toHaveLength(0);
        });

        it('7일 내 기알림 단체를 제외한다', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 두 조직 모두 20일 전 마지막 출석
            await createStudentWithAttendance(seed.org.id, ['20260225']);

            const org2 = await createOrganization(seed.church.id, '초등부', { churchName: 'B본당' });
            await createStudentWithAttendance(org2.id, ['20260225']);

            // seed.org에 대해 이미 알림 로그 생성 (3일 전)
            await database.churnAlertLog.create({
                data: {
                    organizationId: seed.org.id,
                    inactiveDays: 17,
                    sentAt: new Date(2026, 2, 14), // 3일 전
                },
            });

            const result = await usecase.execute();

            expect(result.alerts).toHaveLength(1);
            expect(result.alerts[0].churchName).toBe('B본당');
        });

        it('출석 0건 단체는 감지되지 않는다', async () => {
            vi.setSystemTime(new Date(2026, 2, 17, 0, 0, 0));

            // 출석 기록 없음 (학생만 있고 출석이 없는 경우)
            // HAVING COUNT >= 1 이므로 쿼리에서 제외됨
            const now = getNowKST();
            await database.student.create({
                data: {
                    societyName: '출석없는학생',
                    organizationId: seed.org.id,
                    createdAt: now,
                },
            });

            const result = await usecase.execute();

            expect(result.alerts).toHaveLength(0);
        });
    });
});
