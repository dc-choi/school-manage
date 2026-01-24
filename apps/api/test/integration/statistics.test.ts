/**
 * Statistics 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 통계 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.js';
import { createMockAttendance, createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.js';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('statistics 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.group.findMany.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.attendance.findMany.mockReset();
        mockPrismaClient.$queryRaw.mockReset();
    });

    describe('statistics.excellent (우수 출석 학생 조회)', () => {
        it('우수 출석 학생 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            // 그룹 목록 조회
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // $queryRaw 반환값: 우수 출석 학생
            mockPrismaClient.$queryRaw.mockResolvedValueOnce([
                { _id: BigInt(1), society_name: '홍길동', count: BigInt(15) },
                { _id: BigInt(2), society_name: '김철수', count: BigInt(10) },
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
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: mockStudent.id, content: '◎', date: '2024-01-07' }),
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
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: mockStudent.id, content: '◎', date: '2024-01-07' }),
                createMockAttendance({ studentId: mockStudent.id, content: '○', date: '2024-01-14' }),
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
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([
                createMockAttendance({ studentId: mockStudent.id, content: '◎', date: '2024-01-07' }),
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
            const maleStudent = createMockStudent({ groupId: mockGroup.id, gender: 'M' });
            const femaleStudent = createMockStudent({ groupId: mockGroup.id, gender: 'F' });
            const unknownStudent = createMockStudent({ groupId: mockGroup.id, gender: null });

            // byGender는 student.findMany를 한 번 호출하고, 그 후 성별별로 attendance.findMany를 호출
            mockPrismaClient.student.findMany.mockResolvedValueOnce([maleStudent, femaleStudent, unknownStudent]);
            // 남학생 출석, 여학생 출석, 미지정 출석
            mockPrismaClient.attendance.findMany
                .mockResolvedValueOnce([createMockAttendance({ studentId: maleStudent.id })])
                .mockResolvedValueOnce([createMockAttendance({ studentId: femaleStudent.id })])
                .mockResolvedValueOnce([]);

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

        it('학생이 없는 경우 모두 0 반환', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);

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
            const mockStudent1 = createMockStudent({ groupId: mockGroup1.id });
            const mockStudent2 = createMockStudent({ groupId: mockGroup2.id });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup1, mockGroup2]);
            // 각 그룹별 학생 조회
            mockPrismaClient.student.findMany
                .mockResolvedValueOnce([mockStudent1])
                .mockResolvedValueOnce([mockStudent2]);
            // 각 그룹별 출석 조회
            mockPrismaClient.attendance.findMany
                .mockResolvedValueOnce([createMockAttendance({ studentId: mockStudent1.id })])
                .mockResolvedValueOnce([]);

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
            const mockGroup = createMockGroup({ accountId: BigInt(accountId), name: '1반' });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // $queryRaw 반환값: 전체 학생 점수
            mockPrismaClient.$queryRaw.mockResolvedValueOnce([
                { _id: BigInt(1), society_name: '홍길동', group_name: '1반', score: BigInt(15) },
                { _id: BigInt(2), society_name: '김철수', group_name: '1반', score: BigInt(10) },
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
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            // 주간, 월간, 연간 출석 조회
            mockPrismaClient.attendance.findMany
                .mockResolvedValueOnce([createMockAttendance({ studentId: mockStudent.id })])
                .mockResolvedValueOnce([createMockAttendance({ studentId: mockStudent.id })])
                .mockResolvedValueOnce([createMockAttendance({ studentId: mockStudent.id })]);

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
});