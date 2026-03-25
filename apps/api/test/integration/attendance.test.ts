/**
 * Attendance 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 출석 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAttendance, createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.ts';
import { createPublicCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('attendance 통합 테스트', () => {
    beforeEach(() => {
        // 모든 mock 초기화
        mockPrismaClient.group.findFirst.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.studentGroup.findMany.mockReset();
        mockPrismaClient.studentGroup.count.mockReset();
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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({});
            const mockAttendance = createMockAttendance({ studentId: mockStudent.id });

            // 소유권 검증: 그룹이 해당 조직 소속인지 확인
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // UseCase가 StudentGroup 기반으로 students와 attendances를 별도로 조회함
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: mockStudent.id, student: mockStudent },
            ]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({});
            const mockAttendance = createMockAttendance({ studentId: mockStudent.id });

            // 소유권 검증
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // StudentGroup 기반 학생 조회
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: mockStudent.id, student: mockStudent },
            ]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
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
            const mockGroup = createMockGroup({});
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

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

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
            const mockGroup = createMockGroup({});
            const mockStudent = createMockStudent({});

            // 측정 인프라: 조직의 첫 출석인지 확인
            mockPrismaClient.attendance.count.mockResolvedValueOnce(0);
            mockPrismaClient.organization.findUnique.mockResolvedValueOnce({ createdAt: new Date() });
            // 소유권 검증: 모든 학생이 해당 조직 소속인지
            mockPrismaClient.student.count.mockResolvedValueOnce(1);

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

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
            const result = await caller.attendance.update({
                year: 2024,
                groupId: String(mockGroup.id),
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
            const mockGroup = createMockGroup({});
            const mockStudent = createMockStudent({});
            const existingAttendance = createMockAttendance({ studentId: mockStudent.id });

            // 측정 인프라 + 소유권 검증
            mockPrismaClient.attendance.count.mockResolvedValueOnce(1);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);

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

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
            const result = await caller.attendance.update({
                year: 2024,
                groupId: String(mockGroup.id),
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
                    groupId: '1',
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

        it('attendance 배열이 500개 초과하면 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

            const oversizedAttendance = Array.from({ length: 501 }, (_, i) => ({
                id: String(i + 1),
                month: 1,
                day: 7,
                data: '◎',
            }));

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: oversizedAttendance,
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('attendance 배열이 비어있으면 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({});
            const mockAttendance = createMockAttendance({
                studentId: mockStudent.id,
                date: '2024-01-07',
                content: '◎',
            });

            // Group 권한 검증
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // 전체 학생 수 (StudentGroup 기반)
            mockPrismaClient.studentGroup.count.mockResolvedValueOnce(1);
            // 학생 ID 조회 (StudentGroup 기반)
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([{ studentId: mockStudent.id }]);
            // 월별 출석 데이터
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
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

        it('미사/교리 인원 분리 집계 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const student1 = createMockStudent({ societyName: '학생1' });
            const student2 = createMockStudent({ societyName: '학생2' });
            const student3 = createMockStudent({ societyName: '학생3' });

            // ◎(미사+교리), ○(미사만), △(교리만)
            const attendances = [
                createMockAttendance({ studentId: student1.id, date: '20240107', content: '◎' }),
                createMockAttendance({ studentId: student2.id, date: '20240107', content: '○' }),
                createMockAttendance({ studentId: student3.id, date: '20240107', content: '△' }),
            ];

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            mockPrismaClient.studentGroup.count.mockResolvedValueOnce(3);
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: student1.id },
                { studentId: student2.id },
                { studentId: student3.id },
            ]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce(attendances);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
            const result = await caller.attendance.calendar({
                groupId,
                year: 2024,
                month: 1,
            });

            // 1월 7일 데이터 확인
            const jan7 = result.days.find((d) => d.date === '2024-01-07');
            expect(jan7).toBeDefined();
            expect(jan7!.attendance.present).toBe(3); // 전체 출석: 3명
            expect(jan7!.attendance.massPresent).toBe(2); // 미사: ◎+○ = 2명
            expect(jan7!.attendance.catechismPresent).toBe(2); // 교리: ◎+△ = 2명
            expect(jan7!.attendance.total).toBe(3);
        });

        it('출석 없는 날짜는 모든 카운트가 0', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            mockPrismaClient.studentGroup.count.mockResolvedValueOnce(2);
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: BigInt(1) },
                { studentId: BigInt(2) },
            ]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
            const result = await caller.attendance.calendar({
                groupId,
                year: 2024,
                month: 1,
            });

            // 모든 날짜에서 출석이 0이어야 함
            for (const day of result.days) {
                expect(day.attendance.present).toBe(0);
                expect(day.attendance.massPresent).toBe(0);
                expect(day.attendance.catechismPresent).toBe(0);
                expect(day.attendance.total).toBe(2);
            }
        });

        it('권한 없는 그룹 조회 시 FORBIDDEN 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const otherAccountGroup = createMockGroup({});
            const groupId = String(otherAccountGroup.id);

            // 다른 계정의 그룹이므로 null 반환
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const mockStudent1 = createMockStudent({ societyName: '홍길동' });
            const mockStudent2 = createMockStudent({ societyName: '김철수' });
            const mockAttendance = createMockAttendance({
                studentId: mockStudent1.id,
                date: '2024-01-07',
                content: '◎',
            });

            // Group 권한 검증
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // 학생 목록 (StudentGroup 기반, include: { student })
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: mockStudent1.id, student: mockStudent1 },
                { studentId: mockStudent2.id, student: mockStudent2 },
            ]);
            // 출석 데이터
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([mockAttendance]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);
            const mockStudent = createMockStudent({});

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            // StudentGroup 기반 학생 조회
            mockPrismaClient.studentGroup.findMany.mockResolvedValueOnce([
                { studentId: mockStudent.id, student: mockStudent },
            ]);
            mockPrismaClient.attendance.findMany.mockResolvedValueOnce([]);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');
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
            const otherAccountGroup = createMockGroup({});
            const groupId = String(otherAccountGroup.id);

            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

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
            const mockGroup = createMockGroup({});
            const groupId = String(mockGroup.id);

            const caller = createScopedCaller(accountId, accountName, '1', '장위동 중고등부');

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
