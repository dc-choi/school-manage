/**
 * Statistics 통합 테스트 (실제 DB)
 *
 * 실제 DB 데이터를 사용하여 통계 프로시저 테스트
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createPublicCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

/**
 * 테스트용 그룹 + 학생 + 출석 데이터를 생성하는 헬퍼
 */
async function createGroupWithStudentsAndAttendance(opts: {
    orgId: bigint;
    groupName?: string;
    students: Array<{
        societyName: string;
        gender?: string | null;
        graduatedAt?: Date | null;
        attendances?: Array<{ date: string; content: string }>;
    }>;
}) {
    const now = getNowKST();
    const group = await database.group.create({
        data: {
            name: opts.groupName ?? '1반',
            type: 'GRADE',
            organizationId: opts.orgId,
            createdAt: now,
        },
    });

    for (const s of opts.students) {
        const student = await database.student.create({
            data: {
                societyName: s.societyName,
                gender: s.gender ?? null,
                organizationId: opts.orgId,
                graduatedAt: s.graduatedAt ?? null,
                createdAt: now,
            },
        });

        await database.studentGroup.create({
            data: {
                studentId: student.id,
                groupId: group.id,
                createdAt: now,
            },
        });

        if (s.attendances) {
            for (const att of s.attendances) {
                await database.attendance.create({
                    data: {
                        studentId: student.id,
                        groupId: group.id,
                        date: att.date,
                        content: att.content,
                        createdAt: now,
                    },
                });
            }
        }
    }

    return group;
}

describe('statistics 통합 테스트', () => {
    describe('statistics.excellent (우수 출석 학생 조회)', () => {
        it('우수 출석 학생 조회 성공', async () => {
            // 학생 2명 + 출석 데이터 생성
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [
                            { date: '20240107', content: '◎' },
                            { date: '20240114', content: '◎' },
                            { date: '20240121', content: '○' },
                        ],
                    },
                    {
                        societyName: '김철수',
                        attendances: [
                            { date: '20240107', content: '○' },
                            { date: '20240114', content: '△' },
                        ],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.excellent({ year: 2024 });

            expect(result).toHaveProperty('excellentStudents');
            expect(Array.isArray(result.excellentStudents)).toBe(true);
            expect(result.excellentStudents.length).toBe(2);
            // 점수 내림차순 정렬 확인
            expect(result.excellentStudents[0].count).toBeGreaterThanOrEqual(result.excellentStudents[1].count);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.excellent({ year: 2024 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('statistics.weekly (주간 출석률 조회)', () => {
        it('주간 출석률 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.weekly({
                year: 2024,
                month: 1,
                week: 1,
            });

            expect(result).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('endDate');
            expect(typeof result.attendanceRate).toBe('number');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.weekly({ year: 2024 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('statistics.monthly (월간 출석률 조회)', () => {
        it('월간 출석률 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [
                            { date: '20240107', content: '◎' },
                            { date: '20240114', content: '○' },
                        ],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.monthly({
                year: 2024,
                month: 1,
            });

            expect(result).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('endDate');
            expect(typeof result.attendanceRate).toBe('number');
        });
    });

    describe('statistics.yearly (연간 출석률 조회)', () => {
        it('연간 출석률 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.yearly({ year: 2024 });

            expect(result).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('year');
            expect(result.year).toBe(2024);
        });
    });

    describe('statistics.byGender (성별 분포 조회)', () => {
        it('성별 분포 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '남학생',
                        gender: 'M',
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                    {
                        societyName: '여학생',
                        gender: 'F',
                        attendances: [{ date: '20240107', content: '○' }],
                    },
                    {
                        societyName: '미정학생',
                        gender: null,
                        attendances: [{ date: '20240107', content: '△' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.byGender({ year: 2024 });

            expect(result).toHaveProperty('male');
            expect(result).toHaveProperty('female');
            expect(result).toHaveProperty('unknown');
            expect(result.male).toHaveProperty('count');
            expect(result.male).toHaveProperty('rate');
            expect(result.male.count).toBe(1);
            expect(result.female.count).toBe(1);
            expect(result.unknown.count).toBe(1);
        });

        it('그룹이 없는 경우 모두 0 반환', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.byGender({ year: 2024 });

            expect(result.male.count).toBe(0);
            expect(result.female.count).toBe(0);
            expect(result.unknown.count).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.byGender({ year: 2024 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('statistics.topGroups (그룹별 출석률 순위)', () => {
        it('그룹별 출석률 순위 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                groupName: '1반',
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                ],
            });

            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                groupName: '2반',
                students: [
                    {
                        societyName: '김철수',
                        attendances: [{ date: '20240107', content: '○' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.topGroups({
                year: 2024,
                limit: 5,
            });

            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
            expect(result.groups.length).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.topGroups({ year: 2024, limit: 5 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('statistics.topOverall (전체 우수 학생)', () => {
        it('전체 우수 학생 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                groupName: '1반',
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [
                            { date: '20240107', content: '◎' },
                            { date: '20240114', content: '◎' },
                        ],
                    },
                    {
                        societyName: '김철수',
                        attendances: [{ date: '20240107', content: '○' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.topOverall({
                year: 2024,
                limit: 5,
            });

            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);
            expect(result.students[0]).toHaveProperty('id');
            expect(result.students[0]).toHaveProperty('societyName');
            expect(result.students[0]).toHaveProperty('groupName');
            expect(result.students[0]).toHaveProperty('score');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.topOverall({ year: 2024, limit: 5 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('statistics.groupStatistics (그룹별 상세 통계)', () => {
        it('그룹별 상세 통계 조회 성공', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                groupName: '1반',
                students: [
                    {
                        societyName: '홍길동',
                        attendances: [
                            { date: '20240107', content: '◎' },
                            { date: '20240114', content: '○' },
                        ],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.groupStatistics({
                year: 2024,
            });

            expect(result).toHaveProperty('year');
            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
            expect(result.groups.length).toBeGreaterThan(0);

            const group = result.groups[0];
            expect(group).toHaveProperty('groupId');
            expect(group).toHaveProperty('groupName');
            expect(group).toHaveProperty('weekly');
            expect(group).toHaveProperty('monthly');
            expect(group).toHaveProperty('yearly');
            expect(group).toHaveProperty('totalStudents');
            expect(group).toHaveProperty('registeredStudents');
            expect(group.weekly).toHaveProperty('attendanceRate');
            expect(group.weekly).toHaveProperty('avgAttendance');
        });

        it('그룹이 없는 경우 빈 배열 반환', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.groupStatistics({
                year: 2024,
            });

            expect(result.groups).toEqual([]);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.statistics.groupStatistics({ year: 2024 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('졸업생 필터링', () => {
        it('조회 연도 이전에 졸업한 학생은 출석률 통계에서 제외됨', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '재학생',
                        graduatedAt: null,
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                    {
                        societyName: '졸업생',
                        graduatedAt: new Date(2023, 5, 1), // 2023년 졸업
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.weekly({
                year: 2024,
                month: 1,
                week: 1,
            });

            // 2023년 졸업생은 제외되어 재학생 1명만 포함
            expect(result.totalStudents).toBe(1);
            expect(result.attendanceRate).toBeGreaterThan(0);
        });

        it('졸업 연도와 조회 연도가 같으면 통계에 포함됨', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '재학생',
                        graduatedAt: null,
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                    {
                        societyName: '2024졸업생',
                        graduatedAt: new Date(2024, 5, 1), // 2024년 졸업
                        attendances: [{ date: '20240107', content: '○' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.weekly({
                year: 2024,
                month: 1,
                week: 1,
            });

            // 2024년 졸업생은 포함되어 2명
            expect(result.totalStudents).toBe(2);
        });

        it('모든 학생이 조회 연도 이전에 졸업한 경우 totalStudents 0', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '졸업생1',
                        graduatedAt: new Date(2023, 5, 1),
                        attendances: [],
                    },
                    {
                        societyName: '졸업생2',
                        graduatedAt: new Date(2022, 5, 1),
                        attendances: [],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.weekly({
                year: 2024,
                month: 1,
                week: 1,
            });

            expect(result.totalStudents).toBe(0);
            expect(result.attendanceRate).toBe(0);
        });

        it('졸업생이 성별 분포 통계에서 제외됨', async () => {
            await createGroupWithStudentsAndAttendance({
                orgId: seed.org.id,
                students: [
                    {
                        societyName: '재학남학생',
                        gender: 'M',
                        graduatedAt: null,
                        attendances: [{ date: '20240107', content: '◎' }],
                    },
                    {
                        societyName: '졸업여학생',
                        gender: 'F',
                        graduatedAt: new Date(2023, 5, 1),
                        attendances: [{ date: '20240107', content: '○' }],
                    },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.statistics.byGender({ year: 2024 });

            expect(result.male.count).toBe(1);
            expect(result.female.count).toBe(0); // 졸업생 제외
        });
    });
});
