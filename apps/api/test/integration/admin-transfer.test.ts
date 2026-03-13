/**
 * 관리자 양도 + 계정 삭제 분기 통합 테스트
 *
 * - transferAdmin: ADMIN → TEACHER 역할 교환
 * - deleteAccount: ADMIN 유일 멤버 시 조직 소프트 삭제
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAccount, getTestAccount, testPassword } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { ROLE } from '@school/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('관리자 양도 통합 테스트', () => {
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const orgId = '1';
    const orgName = '장위동 중고등부';

    // ================================================================
    // organization.transferAdmin
    // ================================================================
    describe('organization.transferAdmin', () => {
        const mockTx = {
            account: {
                update: vi.fn().mockResolvedValue({
                    id: BigInt(1),
                    name: '중고등부',
                    displayName: '중고등부',
                }),
            },
            accountSnapshot: {
                create: vi.fn().mockResolvedValue({}),
            },
        };

        beforeEach(() => {
            mockPrismaClient.account.findFirst.mockReset();
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockTx));
            mockTx.account.update.mockReset().mockResolvedValue({
                id: BigInt(1),
                name: '중고등부',
                displayName: '중고등부',
            });
            mockTx.accountSnapshot.create.mockReset().mockResolvedValue({});
        });

        it('ADMIN이 TEACHER에게 양도 → success', async () => {
            const targetAccount = createMockAccount({
                id: BigInt(2),
                name: '선생님',
                displayName: '선생님',
                role: ROLE.TEACHER,
            });
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(targetAccount);

            const caller = createScopedCaller(accountId, testAccount.name, orgId, orgName, {
                role: ROLE.ADMIN,
            });

            const result = await caller.organization.transferAdmin({
                targetAccountId: '2',
            });

            expect(result).toEqual({ success: true });
            expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
        });

        it('자기 자신에게 양도 → BAD_REQUEST', async () => {
            const caller = createScopedCaller(accountId, testAccount.name, orgId, orgName, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: accountId,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('대상이 같은 조직에 없음 → NOT_FOUND', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);

            const caller = createScopedCaller(accountId, testAccount.name, orgId, orgName, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: '999',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('대상이 ADMIN → BAD_REQUEST', async () => {
            const targetAccount = createMockAccount({
                id: BigInt(3),
                name: '다른관리자',
                displayName: '다른관리자',
                role: ROLE.ADMIN,
            });
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(targetAccount);

            const caller = createScopedCaller(accountId, testAccount.name, orgId, orgName, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: '3',
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('TEACHER가 양도 시도 → FORBIDDEN', async () => {
            const caller = createScopedCaller(accountId, testAccount.name, orgId, orgName, {
                role: ROLE.TEACHER,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: '2',
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });

    // ================================================================
    // account.deleteAccount (ADMIN 분기)
    // ================================================================
    describe('account.deleteAccount (ADMIN 분기)', () => {
        const mockTx = {
            account: {
                update: vi.fn().mockResolvedValue({}),
            },
            refreshToken: {
                deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
            joinRequest: {
                updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
            student: {
                updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
            group: {
                updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
            organization: {
                update: vi.fn().mockResolvedValue({}),
            },
        };

        beforeEach(() => {
            mockPrismaClient.account.findFirst.mockReset();
            mockPrismaClient.account.count.mockReset();
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockTx));
            mockTx.account.update.mockReset().mockResolvedValue({});
            mockTx.refreshToken.deleteMany.mockReset().mockResolvedValue({ count: 0 });
            mockTx.joinRequest.updateMany.mockReset().mockResolvedValue({ count: 0 });
            mockTx.student.updateMany.mockReset().mockResolvedValue({ count: 0 });
            mockTx.group.updateMany.mockReset().mockResolvedValue({ count: 0 });
            mockTx.organization.update.mockReset().mockResolvedValue({});
        });

        it('ADMIN + 다른 멤버 존재 → FORBIDDEN', async () => {
            mockPrismaClient.account.count.mockResolvedValueOnce(2);

            const caller = createAuthenticatedCaller(accountId, testAccount.name);
            // consentedProcedure에서는 ctx.account에 organizationId와 role이 있어야 함
            // createAuthenticatedCaller에서는 AccountInfo에 이 필드가 없음
            // account router는 consentedProcedure를 사용하므로 ctx.account.role, ctx.account.organizationId를 전달
            // createAuthenticatedCaller는 account에 role/organizationId가 없음
            // → 실제로 UseCase에 role, organizationId를 전달하는 것은 router에서 하므로
            // → 여기서는 UseCase를 직접 테스트
            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();

            await expect(
                usecase.execute({ password: testPassword }, accountId, ROLE.ADMIN, orgId)
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('ADMIN 유일 멤버 → 조직 소프트 삭제 + 계정 삭제', async () => {
            mockPrismaClient.account.count.mockResolvedValueOnce(1);
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();
            const result = await usecase.execute({ password: testPassword }, accountId, ROLE.ADMIN, orgId);

            expect(result).toEqual({ success: true });
            expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
            expect(mockTx.organization.update).toHaveBeenCalledOnce();
            expect(mockTx.student.updateMany).toHaveBeenCalledOnce();
            expect(mockTx.group.updateMany).toHaveBeenCalledOnce();
            expect(mockTx.joinRequest.updateMany).toHaveBeenCalledOnce();
        });

        it('TEACHER 삭제 → 기존 로직 유지 (조직 삭제 없음)', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();
            const result = await usecase.execute({ password: testPassword }, accountId, ROLE.TEACHER);

            expect(result).toEqual({ success: true });
            expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
            expect(mockTx.organization.update).not.toHaveBeenCalled();
        });
    });
});
