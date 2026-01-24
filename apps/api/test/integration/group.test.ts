/**
 * Group 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 그룹 CRUD 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.js';
import { createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.js';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('group 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.group.findMany.mockReset();
        mockPrismaClient.group.findFirst.mockReset();
        mockPrismaClient.group.create.mockReset();
        mockPrismaClient.group.update.mockReset();
    });

    describe('group.list', () => {
        it('인증된 사용자의 그룹 목록 반환', async () => {
            const testAccount = getTestAccount();
            const mockGroups = [
                { ...createMockGroup({ accountId: testAccount.id }), _count: { students: 3 } },
                { ...createMockGroup({ accountId: testAccount.id }), _count: { students: 5 } },
            ];
            mockPrismaClient.group.findMany.mockResolvedValueOnce(mockGroups);

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.list();

            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
            expect(result.groups.length).toBe(2);
            expect(result.groups[0].studentCount).toBe(3);
            expect(result.groups[1].studentCount).toBe(5);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('group.create', () => {
        it('새 그룹 생성 성공', async () => {
            const testAccount = getTestAccount();
            const newGroup = createMockGroup({ name: '테스트그룹', accountId: testAccount.id });
            mockPrismaClient.group.create.mockResolvedValueOnce(newGroup);

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.create({ name: '테스트그룹' });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result.name).toBe('테스트그룹');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.create({ name: '테스트그룹' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('이름 없이 생성 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.create({ name: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('group.get', () => {
        it('그룹 상세 조회 성공 (학생 목록 포함)', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            const mockStudents = [
                createMockStudent({ groupId: mockGroup.id, societyName: '홍길동' }),
                createMockStudent({ groupId: mockGroup.id, societyName: '김철수' }),
            ];
            mockPrismaClient.group.findFirst.mockResolvedValueOnce({
                ...mockGroup,
                students: mockStudents,
            });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.get({ id: String(mockGroup.id) });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);
        });

        it('학생이 없는 그룹 조회 성공', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            mockPrismaClient.group.findFirst.mockResolvedValueOnce({
                ...mockGroup,
                students: [],
            });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.get({ id: String(mockGroup.id) });

            expect(result).toHaveProperty('students');
            expect(result.students.length).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.get({ id: '1' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.get({ id: 'invalid-id' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('group.update', () => {
        it('그룹 수정 성공', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            const updatedGroup = { ...mockGroup, name: '수정된그룹', _count: { students: 2 } };
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            mockPrismaClient.group.update.mockResolvedValueOnce(updatedGroup);

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.update({ id: String(mockGroup.id), name: '수정된그룹' });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('수정된그룹');
            expect(result.studentCount).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.update({ id: '1', name: '수정그룹' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.update({ id: 'invalid-id', name: '수정그룹' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('group.delete', () => {
        it('그룹 삭제 성공', async () => {
            const testAccount = getTestAccount();
            const mockGroup = createMockGroup({ accountId: testAccount.id });
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(mockGroup);
            mockPrismaClient.group.update.mockResolvedValueOnce({ ...mockGroup, deletedAt: new Date() });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.delete({ id: String(mockGroup.id) });

            expect(result).toHaveProperty('id');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.delete({ id: '1' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.delete({ id: 'invalid-id' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('group.bulkDelete', () => {
        beforeEach(() => {
            mockPrismaClient.group.updateMany.mockReset();
        });

        it('여러 그룹 일괄 삭제 성공', async () => {
            const testAccount = getTestAccount();
            const mockGroups = [
                createMockGroup({ accountId: testAccount.id }),
                createMockGroup({ accountId: testAccount.id }),
            ];
            mockPrismaClient.group.updateMany.mockResolvedValueOnce({ count: 2 });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.bulkDelete({
                ids: mockGroups.map((g) => String(g.id)),
            });

            expect(result).toHaveProperty('deletedCount');
            expect(result.deletedCount).toBe(2);
        });

        it('일부 그룹만 삭제되는 경우 (다른 계정 소유)', async () => {
            const testAccount = getTestAccount();
            // 1개만 삭제됨 (다른 계정 소유 그룹은 삭제 안 됨)
            mockPrismaClient.group.updateMany.mockResolvedValueOnce({ count: 1 });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.group.bulkDelete({ ids: ['1', '2'] });

            expect(result.deletedCount).toBe(1);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.bulkDelete({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.bulkDelete({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 포함 시 BAD_REQUEST 에러', async () => {
            const testAccount = getTestAccount();
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.group.bulkDelete({ ids: ['1', 'invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });
});
