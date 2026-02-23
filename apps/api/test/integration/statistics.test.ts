/**
 * Statistics 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 통계 프로시저 테스트 (스냅샷 기반)
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import {
    createMockAttendance,
    createMockGroup,
    createMockGroupSnapshot,
    createMockStudent,
    createMockStudentSnapshot,
    getTestAccount,
} from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it } from 'vitest';

describe('statistics 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.group.findMany.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.attendance.findMany.mockReset();
        mockPrismaClient.studentSnapshot.findMany.mockReset();
        mockPrismaClient.groupSnapshot.findMany.mockReset();
        mockPrismaClient.$queryRaw.mockReset();
    });

    describe('statistics.excellent (우수 출석 학생 조회)', () => {
        it('우수 출석 학생 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            // $queryRaw 반환값: 우수 출석 학생
            mockPrismaClient.$queryRaw.mockResolvedValueOnce([
                { _id: BigInt(1), society_name: '홍길동', count: BigInt(15) },
                { _id: BigInt(2), society_name: '김철수', count: BigInt(10) },
            ]);
            // getBulkStudentSnapshots → studentSnapshot.findMany
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                createMockStudentSnapshot({ studentId: BigInt(1), societyName: '홍길동' }),
                createMockStudentSnapshot({ studentId: BigInt(2), societyName: '김철수' }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.excellent({ year: 2024 });

            expect(result).toHaveProperty('excellentStudents');
            expect(Array.isArray(result.excellentStudents)).toBe(true);
            expect(result.excellentStudents.length).toBe(2);
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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '◎',
                    date: '2024-01-07',
                }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.weekly({ year: 2024 });

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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '◎',
                    date: '2024-01-07',
                }),
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '○',
                    date: '2024-01-14',
                }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.monthly({ year: 2024 });

            expect(result).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('endDate');
            expect(typeof result.attendanceRate).toBe('number');
        });
    });

    describe('statistics.yearly (연간 출석률 조회)', () => {
        it('연간 출석률 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '◎',
                    date: '2024-01-07',
                }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.yearly({ year: 2024 });

            expect(result).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('year');
            expect(result.year).toBe(2024);
        });
    });

    describe('statistics.byGender (성별 분포 조회)', () => {
        it('성별 분포 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            // group.findMany
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // student.findMany (그룹 소속 전체 학생 조회)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([
                createMockStudent({ id: BigInt(1), groupId: mockGroup.id, gender: 'M' }),
                createMockStudent({ id: BigInt(2), groupId: mockGroup.id, gender: 'F' }),
                createMockStudent({ id: BigInt(3), groupId: mockGroup.id, gender: null }),
            ]);
            // attendance.findMany (기간 내 전체 출석 데이터)
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: BigInt(1), groupId: mockGroup.id, content: '◎' }),
                createMockAttendance({ studentId: BigInt(2), groupId: mockGroup.id, content: '○' }),
                createMockAttendance({ studentId: BigInt(3), groupId: mockGroup.id, content: '△' }),
            ]);
            // getBulkStudentSnapshots → studentSnapshot.findMany
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                createMockStudentSnapshot({ studentId: BigInt(1), gender: 'M' }),
                createMockStudentSnapshot({ studentId: BigInt(2), gender: 'F' }),
                createMockStudentSnapshot({ studentId: BigInt(3), gender: null }),
            ]);
            // fallback student.findMany (스냅샷에 없는 학생용 — 이 케이스에선 빈 배열)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.byGender({ year: 2024 });

            expect(result).toHaveProperty('male');
            expect(result).toHaveProperty('female');
            expect(result).toHaveProperty('unknown');
            expect(result.male).toHaveProperty('count');
            expect(result.male).toHaveProperty('rate');
            expect(result.female).toHaveProperty('count');
            expect(result.unknown).toHaveProperty('count');
        });

        it('그룹이 없는 경우 모두 0 반환', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            mockPrismaClient.group.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup1 = createMockGroup({ accountId: BigInt(accountId), name: '1반' });
            const mockGroup2 = createMockGroup({ accountId: BigInt(accountId), name: '2반' });

            // group.findMany
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup1, mockGroup2]);
            // student.findMany (그룹별 학생 수 조회)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([
                createMockStudent({ id: BigInt(1), groupId: mockGroup1.id }),
                createMockStudent({ id: BigInt(2), groupId: mockGroup2.id }),
            ]);
            // attendance.findMany (groupId 기반)
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: BigInt(1), groupId: mockGroup1.id, content: '◎' }),
                createMockAttendance({ studentId: BigInt(2), groupId: mockGroup2.id, content: '○' }),
            ]);
            // getBulkGroupSnapshots → groupSnapshot.findMany
            mockPrismaClient.groupSnapshot.findMany.mockResolvedValueOnce([
                createMockGroupSnapshot({ groupId: mockGroup1.id, name: '1반' }),
                createMockGroupSnapshot({ groupId: mockGroup2.id, name: '2반' }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.topGroups({ year: 2024, limit: 5 });

            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            // $queryRaw 반환값: 전체 학생 점수 (group_id 추가)
            mockPrismaClient.$queryRaw.mockResolvedValueOnce([
                { _id: BigInt(1), society_name: '홍길동', group_name: '1반', group_id: BigInt(10), score: BigInt(15) },
                { _id: BigInt(2), society_name: '김철수', group_name: '1반', group_id: BigInt(10), score: BigInt(10) },
            ]);
            // getBulkStudentSnapshots → studentSnapshot.findMany
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                createMockStudentSnapshot({ studentId: BigInt(1), societyName: '홍길동' }),
                createMockStudentSnapshot({ studentId: BigInt(2), societyName: '김철수' }),
            ]);
            // getBulkGroupSnapshots → groupSnapshot.findMany
            mockPrismaClient.groupSnapshot.findMany.mockResolvedValueOnce([
                createMockGroupSnapshot({ groupId: BigInt(10), name: '1반' }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.topOverall({ year: 2024, limit: 5 });

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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId), name: '1반' });

            // group.findMany
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // student.findMany (그룹별 학생 수 조회)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([
                createMockStudent({ id: BigInt(1), groupId: mockGroup.id }),
            ]);
            // getBulkGroupSnapshots → groupSnapshot.findMany
            mockPrismaClient.groupSnapshot.findMany.mockResolvedValueOnce([
                createMockGroupSnapshot({ groupId: mockGroup.id, name: '1반' }),
            ]);
            // 주간, 월간, 연간 attendance.findMany (3회)
            mockPrismaClient.attendance.findMany
                .mockResolvedValueOnce([createMockAttendance({ studentId: BigInt(1), groupId: mockGroup.id })])
                .mockResolvedValueOnce([createMockAttendance({ studentId: BigInt(1), groupId: mockGroup.id })])
                .mockResolvedValueOnce([createMockAttendance({ studentId: BigInt(1), groupId: mockGroup.id })]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.groupStatistics({ year: 2024 });

            expect(result).toHaveProperty('year');
            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
            if (result.groups.length > 0) {
                const group = result.groups[0];
                expect(group).toHaveProperty('groupId');
                expect(group).toHaveProperty('groupName');
                expect(group).toHaveProperty('weekly');
                expect(group).toHaveProperty('monthly');
                expect(group).toHaveProperty('yearly');
                expect(group).toHaveProperty('totalStudents');
                expect(group.weekly).toHaveProperty('attendanceRate');
                expect(group.weekly).toHaveProperty('avgAttendance');
            }
        });

        it('그룹이 없는 경우 빈 배열 반환', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            mockPrismaClient.group.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.groupStatistics({ year: 2024 });

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
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // 졸업 필터 적용 후 재학생 1명만 반환 (2023년 졸업생은 제외됨)
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '◎',
                    date: '2024-01-07',
                }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.weekly({ year: 2024 });

            expect(result.totalStudents).toBe(1);
            expect(result.attendanceRate).toBeGreaterThan(0);
        });

        it('졸업 연도와 조회 연도가 같으면 통계에 포함됨', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // 2024년 졸업생 + 재학생 = 2명 (2024년 조회 시 포함)
            mockPrismaClient.student.count.mockResolvedValueOnce(2);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({
                    studentId: BigInt(1),
                    groupId: mockGroup.id,
                    content: '◎',
                    date: '2024-01-07',
                }),
                createMockAttendance({
                    studentId: BigInt(2),
                    groupId: mockGroup.id,
                    content: '○',
                    date: '2024-01-07',
                }),
            ]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.weekly({ year: 2024 });

            expect(result.totalStudents).toBe(2);
        });

        it('모든 학생이 조회 연도 이전에 졸업한 경우 totalStudents 0', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // 졸업 필터 적용 후 0명
            mockPrismaClient.student.count.mockResolvedValueOnce(0);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.weekly({ year: 2024 });

            expect(result.totalStudents).toBe(0);
            expect(result.attendanceRate).toBe(0);
        });

        it('월별 조회 시 해당 월 시작일 기준으로 졸업 필터 적용', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            await caller.statistics.monthly({ year: 2024, month: 3 });

            // student.count 호출 시 졸업 기준일이 3월 1일인지 확인
            const countCall = mockPrismaClient.student.count.mock.calls[0]?.[0];
            const graduationFilter = countCall?.where?.OR;
            expect(graduationFilter).toEqual([{ graduatedAt: null }, { graduatedAt: { gte: new Date(2024, 2, 1) } }]);
        });

        it('졸업생이 성별 분포 통계에서 제외됨', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            // group.findMany
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // student.findMany (졸업 필터 적용 후 재학생 1명만)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([
                createMockStudent({ id: BigInt(1), groupId: mockGroup.id, gender: 'M' }),
            ]);
            // attendance.findMany
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: BigInt(1), groupId: mockGroup.id, content: '◎' }),
            ]);
            // getBulkStudentSnapshots → studentSnapshot.findMany
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                createMockStudentSnapshot({ studentId: BigInt(1), gender: 'M' }),
            ]);
            // fallback student.findMany
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.statistics.byGender({ year: 2024 });

            expect(result.male.count).toBe(1);
            expect(result.female.count).toBe(0);
        });
    });
});
