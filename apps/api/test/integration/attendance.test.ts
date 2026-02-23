/**
 * Attendance 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 출석 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAttendance, createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('attendance 통합 테스트', () => {
    beforeEach(() => {
        // 모든 mock 초기화
        mockPrismaClient.group.findFirst.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.attendance.findMany.mockReset();
        mockPrismaClient.attendance.updateMany.mockReset();
        mockPrismaClient.attendance.create.mockReset();
        mockPrismaClient.attendance.findFirst.mockReset();
    });

    describe('group.attendance (출석 조회)', () => {
        it('그룹별 출석 현황 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({ groupId: BigInt(groupId) });
            const mockAttendance = createMockAttendance({ studentId: mockStudent.id });

            // UseCase가 students와 attendances를 별도로 조회함
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.group.attendance({ groupId });

            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('attendances');
            expect(result).toHaveProperty('year');
            expect(Array.isArray(result.students)).toBe(true);
        });

        it('특정 연도 출석 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({ groupId: BigInt(groupId) });
            const mockAttendance = createMockAttendance({ studentId: mockStudent.id });

            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.group.attendance({
                groupId,
                year: 2024,
            });

            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('year');
            expect(result.year).toBe(2024);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            const groupId = String(mockGroup.id);

            const caller = createPublicCaller();

            await expect(caller.group.attendance({ groupId })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 그룹 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.group.attendance({ groupId: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('attendance.update', () => {
        it('출석 입력 성공 (새 출석 생성)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            // $transaction mock
            const txMock = {
                student: {
                    findMany: vi.fn().mockResolvedValue([{ id: mockStudent.id, groupId: mockGroup.id }]),
                },
                attendance: {
                    findFirst: vi.fn().mockResolvedValue(null),
                    create: vi
                        .fn()
                        .mockResolvedValue(createMockAttendance({ studentId: mockStudent.id, groupId: mockGroup.id })),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((callback) => callback(txMock));

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.attendance.update({
                year: 2024,
                attendance: [
                    {
                        id: String(mockStudent.id),
                        month: 1,
                        day: 7,
                        data: 'O',
                    },
                ],
                isFull: true,
            });

            expect(result).toHaveProperty('row');
            expect(result).toHaveProperty('isFull');
            expect(result.isFull).toBe(true);
        });

        it('출석 수정 성공 (기존 출석 업데이트)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const mockStudent = createMockStudent({ groupId: mockGroup.id });
            const existingAttendance = createMockAttendance({ studentId: mockStudent.id });

            // $transaction mock - existing attendance found
            const txMock = {
                student: {
                    findMany: vi.fn().mockResolvedValue([{ id: mockStudent.id, groupId: mockGroup.id }]),
                },
                attendance: {
                    findFirst: vi.fn().mockResolvedValue(existingAttendance),
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((callback) => callback(txMock));

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.attendance.update({
                year: 2024,
                attendance: [
                    {
                        id: String(mockStudent.id),
                        month: 1,
                        day: 7,
                        data: 'X',
                    },
                ],
                isFull: true,
            });

            expect(result).toHaveProperty('row');
            expect(result).toHaveProperty('isFull');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.attendance.update({
                    year: 2024,
                    attendance: [
                        {
                            id: '1',
                            month: 1,
                            day: 7,
                            data: 'O',
                        },
                    ],
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('attendance 배열이 비어있으면 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.attendance.update({
                    year: 2024,
                    attendance: [],
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('attendance.calendar (달력 조회)', () => {
        it('월별 달력 데이터 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({ groupId: mockGroup.id });
            const mockAttendance = createMockAttendance({
                studentId: mockStudent.id,
                date: '2024-01-07',
                content: '◎',
            });

            // Group 권한 검증
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // 전체 학생 수
            mockPrismaClient.student.count.mockResolvedValueOnce(1);
            // 학생 ID 조회
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            // 월별 출석 데이터
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.attendance.calendar({
                groupId,
                year: 2024,
                month: 1,
            });

            expect(result).toHaveProperty('year', 2024);
            expect(result).toHaveProperty('month', 1);
            expect(result).toHaveProperty('totalStudents', 1);
            expect(result).toHaveProperty('days');
            expect(Array.isArray(result.days)).toBe(true);
            expect(result.days.length).toBe(31); // 1월은 31일
        });

        it('권한 없는 그룹 조회 시 FORBIDDEN 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const otherAccountGroup = createMockGroup({ accountId: BigInt(999) });
            const groupId = String(otherAccountGroup.id);

            // 다른 계정의 그룹이므로 null 반환
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.attendance.calendar({
                    groupId,
                    year: 2024,
                    month: 1,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const mockGroup = createMockGroup();
            const groupId = String(mockGroup.id);

            const caller = createPublicCaller();

            await expect(
                caller.attendance.calendar({
                    groupId,
                    year: 2024,
                    month: 1,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('attendance.dayDetail (날짜별 상세 조회)', () => {
        it('특정 날짜 출석 상세 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);
            const mockStudent1 = createMockStudent({ groupId: mockGroup.id, societyName: '홍길동' });
            const mockStudent2 = createMockStudent({ groupId: mockGroup.id, societyName: '김철수' });
            const mockAttendance = createMockAttendance({
                studentId: mockStudent1.id,
                date: '2024-01-07',
                content: '◎',
            });

            // Group 권한 검증
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // 학생 목록
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent1, mockStudent2]);
            // 출석 데이터
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.attendance.dayDetail({
                groupId,
                date: '2024-01-07',
            });

            expect(result).toHaveProperty('date', '2024-01-07');
            expect(result).toHaveProperty('holyday');
            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);

            // 첫 번째 학생은 출석 O
            const student1Result = result.students.find((s) => s.id === String(mockStudent1.id));
            expect(student1Result?.content).toBe('◎');

            // 두 번째 학생은 출석 데이터 없음
            const student2Result = result.students.find((s) => s.id === String(mockStudent2.id));
            expect(student2Result?.content).toBe('');
        });

        it('의무축일 정보 포함 확인 (1월 1일 - 천주의 성모 마리아 대축일)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({ groupId: mockGroup.id });

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([]);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.attendance.dayDetail({
                groupId,
                date: '2024-01-01',
            });

            expect(result.holyday).toBe('천주의 성모 마리아 대축일');
        });

        it('권한 없는 그룹 조회 시 FORBIDDEN 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const otherAccountGroup = createMockGroup({ accountId: BigInt(999) });
            const groupId = String(otherAccountGroup.id);

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.attendance.dayDetail({
                    groupId,
                    date: '2024-01-07',
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const mockGroup = createMockGroup();
            const groupId = String(mockGroup.id);

            const caller = createPublicCaller();

            await expect(
                caller.attendance.dayDetail({
                    groupId,
                    date: '2024-01-07',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 날짜 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.attendance.dayDetail({
                    groupId,
                    date: '2024-1-7', // 잘못된 형식
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });
});
