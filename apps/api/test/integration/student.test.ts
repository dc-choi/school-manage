/**
 * Student 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 학생 CRUD 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.js';
import { createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.js';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('student 통합 테스트', () => {
    beforeEach(() => {
        // 모든 mock 초기화
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.findFirst.mockReset();
        mockPrismaClient.student.create.mockReset();
        mockPrismaClient.student.update.mockReset();
        mockPrismaClient.group.findFirst.mockReset();
    });

    describe('student.list', () => {
        it('학생 목록 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const mockStudentsWithGroup = [
                { ...createMockStudent({}), group: { name: '테스트그룹' } },
                { ...createMockStudent({}), group: { name: '테스트그룹' } },
            ];
            mockPrismaClient.student.findMany.mockResolvedValueOnce(mockStudentsWithGroup);
            mockPrismaClient.student.count.mockResolvedValueOnce(2);

            const caller = createAuthenticatedCaller(accountId, accountName);
            // listStudentsInputSchema: { page, searchOption, searchWord }
            const result = await caller.student.list({});

            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.list({})).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('student.create', () => {
        it('학생 생성 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const newStudent = createMockStudent({
                societyName: '홍길동',
                groupId: BigInt(groupId),
            });
            mockPrismaClient.student.create.mockResolvedValueOnce(newStudent);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.create({
                societyName: '홍길동',
                groupId,
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
            expect(result.societyName).toBe('홍길동');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            const groupId = String(mockGroup.id);

            const caller = createPublicCaller();

            await expect(caller.student.create({ societyName: '홍길동', groupId })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('필수 필드 누락 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.create({ societyName: '', groupId })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.get', () => {
        it('학생 상세 조회 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const mockStudent = createMockStudent({ groupId: BigInt(groupId) });
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(mockStudent);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.get({ id: String(mockStudent.id) });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.get({ id: '1' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.get({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.update', () => {
        it('학생 수정 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const mockStudent = createMockStudent({ groupId: BigInt(groupId) });
            const updatedStudent = { ...mockStudent, societyName: '수정된이름' };
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(mockStudent);
            mockPrismaClient.student.update.mockResolvedValueOnce(updatedStudent);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.update({
                id: String(mockStudent.id),
                societyName: '수정된이름',
                groupId,
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
            expect(result.societyName).toBe('수정된이름');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.update({ id: '1', societyName: '수정', groupId: '1' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.student.update({ id: 'invalid-id', societyName: '수정', groupId: '1' })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.delete', () => {
        it('학생 삭제 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
            const groupId = String(mockGroup.id);

            const mockStudent = createMockStudent({ groupId: BigInt(groupId) });
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(mockStudent);
            mockPrismaClient.student.update.mockResolvedValueOnce({
                ...mockStudent,
                deletedAt: new Date(),
            });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.delete({ id: String(mockStudent.id) });

            expect(result).toHaveProperty('id');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.delete({ id: '1' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.delete({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.bulkDelete', () => {
        it('학생 일괄 삭제 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            // 그룹 목록 반환 (계정 소유 확인용)
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // updateMany 결과 반환
            mockPrismaClient.student.updateMany.mockResolvedValueOnce({ count: 3 });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.bulkDelete({ ids: ['1', '2', '3'] });

            expect(result).toHaveProperty('deletedCount');
            expect(result.deletedCount).toBe(3);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.bulkDelete({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.bulkDelete({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.bulkDelete({ ids: ['invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.restore', () => {
        it('학생 복구 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            // 그룹 목록 반환 (계정 소유 확인용)
            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            // updateMany 결과 반환
            mockPrismaClient.student.updateMany.mockResolvedValueOnce({ count: 2 });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.restore({ ids: ['1', '2'] });

            expect(result).toHaveProperty('restoredCount');
            expect(result.restoredCount).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.restore({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.restore({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.restore({ ids: ['invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.graduate', () => {
        it('학생 일괄 졸업 처리 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            const mockStudent1 = createMockStudent({
                id: BigInt(1),
                societyName: '홍길동',
                groupId: mockGroup.id,
                graduatedAt: null,
                deletedAt: null,
            });
            const mockStudent2 = createMockStudent({
                id: BigInt(2),
                societyName: '김철수',
                groupId: mockGroup.id,
                graduatedAt: null,
                deletedAt: null,
            });

            // $transaction mock
            const txMock = {
                student: {
                    findMany: vi.fn().mockResolvedValue([
                        { ...mockStudent1, group: mockGroup },
                        { ...mockStudent2, group: mockGroup },
                    ]),
                    update: vi.fn().mockResolvedValue({}),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.graduate({ ids: ['1', '2'] });

            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
            expect(result).toHaveProperty('graduatedCount');
            expect(result.graduatedCount).toBe(2);
            expect(result).toHaveProperty('students');
            expect(result.students.length).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.graduate({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.graduate({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('100개 초과 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);
            const manyIds = Array.from({ length: 101 }, (_, i) => String(i + 1));

            await expect(caller.student.graduate({ ids: manyIds })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.cancelGraduation', () => {
        it('학생 졸업 취소 성공', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            const mockStudent = createMockStudent({
                id: BigInt(1),
                societyName: '홍길동',
                groupId: mockGroup.id,
                graduatedAt: new Date(),
                deletedAt: null,
            });

            // $transaction mock
            const txMock = {
                student: {
                    findMany: vi.fn().mockResolvedValue([{ ...mockStudent, group: mockGroup }]),
                    update: vi.fn().mockResolvedValue({}),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.cancelGraduation({ ids: ['1'] });

            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
            expect(result).toHaveProperty('cancelledCount');
            expect(result.cancelledCount).toBe(1);
            expect(result).toHaveProperty('students');
            expect(result.students[0].graduatedAt).toBe(null);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.cancelGraduation({ ids: ['1'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(caller.student.cancelGraduation({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.promote', () => {
        it('학생 학년 진급 성공 (중고등부)', async () => {
            const testAccount = getTestAccount(); // 중고등부 계정
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;

            // 중고등부 진급에 필요한 그룹들
            const adultGroup = createMockGroup({ id: BigInt(100), name: '성인', accountId: BigInt(accountId) });
            const high3Group = createMockGroup({ id: BigInt(101), name: '고3', accountId: BigInt(accountId) });

            // 성인 그룹 찾기
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(adultGroup);
            // 고3 그룹 찾기
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(high3Group);
            // 20세 학생 조회 (성인 그룹으로 이동 대상)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            // 19세 학생 조회 (고3 그룹으로 이동 대상)
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);

            // $transaction mock
            const txMock = {
                student: {
                    findMany: vi.fn().mockResolvedValue([]),
                    update: vi.fn().mockResolvedValue({}),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.promote();

            expect(result).toHaveProperty('row');
            expect(result.row).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.promote()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('student.list (graduated 필터)', () => {
        it('재학생만 조회 (graduated: false)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            const mockActiveStudent = {
                ...createMockStudent({ groupId: mockGroup.id, graduatedAt: null }),
                group: { name: '테스트그룹' },
            };

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockActiveStudent]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.list({ graduated: false });

            expect(result.students.length).toBe(1);
            expect(result.students[0].graduatedAt).toBeUndefined();
        });

        it('졸업생만 조회 (graduated: true)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            const mockGraduatedStudent = {
                ...createMockStudent({ groupId: mockGroup.id, graduatedAt: new Date() }),
                group: { name: '테스트그룹' },
            };

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([mockGraduatedStudent]);
            mockPrismaClient.student.count.mockResolvedValueOnce(1);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.list({ graduated: true });

            expect(result.students.length).toBe(1);
            expect(result.students[0].graduatedAt).toBeDefined();
        });

        it('전체 조회 (graduated: null)', async () => {
            const testAccount = getTestAccount();
            const accountId = String(testAccount.id);
            const accountName = testAccount.name;
            const mockGroup = createMockGroup({ accountId: BigInt(accountId) });

            const mockStudents = [
                { ...createMockStudent({ groupId: mockGroup.id, graduatedAt: null }), group: { name: '테스트그룹' } },
                {
                    ...createMockStudent({ groupId: mockGroup.id, graduatedAt: new Date() }),
                    group: { name: '테스트그룹' },
                },
            ];

            mockPrismaClient.group.findMany.mockResolvedValueOnce([mockGroup]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce(mockStudents);
            mockPrismaClient.student.count.mockResolvedValueOnce(2);

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.student.list({ graduated: null });

            expect(result.students.length).toBe(2);
        });
    });
});
