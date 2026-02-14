/**
 * Auth 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 인증 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAccount, getTestAccount, testPassword } from '../helpers/mock-data.ts';
import { createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth.login 통합 테스트', () => {
    beforeEach(() => {
        // Mock 초기화
        mockPrismaClient.account.findFirst.mockReset();
    });

    describe('정상 케이스', () => {
        it('유효한 자격 증명으로 로그인 성공', async () => {
            const testAccount = getTestAccount();
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(testAccount);

            const caller = createPublicCaller();
            const result = await caller.auth.login({
                name: testAccount.name,
                password: testPassword,
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('name');
            expect(typeof result.accessToken).toBe('string');
            expect(result.name).toBe(testAccount.name);
        });
    });

    describe('예외 케이스', () => {
        it('존재하지 않는 계정으로 로그인 시 NOT_FOUND', async () => {
            // 1차: 활성 계정 조회 → null
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);
            // 2차: 삭제된 계정 조회 → null
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: 'nonexistent-account-test',
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('잘못된 비밀번호로 로그인 시 UNAUTHORIZED', async () => {
            const testAccount = getTestAccount();
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(testAccount);

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: testAccount.name,
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('삭제된 계정 + 올바른 비밀번호 + 2년 이내 → FORBIDDEN (ACCOUNT_DELETED)', async () => {
            const recentlyDeleted = new Date();
            recentlyDeleted.setMonth(recentlyDeleted.getMonth() - 6);

            const deletedAccount = createMockAccount({
                deletedAt: recentlyDeleted,
            });

            // 1차: 활성 계정 조회 → null
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);
            // 2차: 삭제된 계정 조회 → 삭제된 계정 발견
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(deletedAccount);

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: deletedAccount.name,
                    password: testPassword,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'ACCOUNT_DELETED',
            });
        });

        it('삭제된 계정 + 잘못된 비밀번호 → NOT_FOUND (삭제 여부 미노출)', async () => {
            const recentlyDeleted = new Date();
            recentlyDeleted.setMonth(recentlyDeleted.getMonth() - 6);

            const deletedAccount = createMockAccount({
                deletedAt: recentlyDeleted,
            });

            // 1차: 활성 계정 조회 → null
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);
            // 2차: 삭제된 계정 조회 → 삭제된 계정 발견
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(deletedAccount);

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: deletedAccount.name,
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });
    });
});

describe('auth.restoreAccount 통합 테스트', () => {
    const mockTx = {
        account: { update: vi.fn().mockResolvedValue(null) },
        group: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue(null) },
        student: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue(null) },
        attendance: { updateMany: vi.fn().mockResolvedValue(null) },
    };

    beforeEach(() => {
        mockPrismaClient.account.findFirst.mockReset();
        mockPrismaClient.account.update.mockReset();
        mockPrismaClient.$transaction = vi
            .fn()
            .mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(mockTx));
    });

    describe('정상 케이스', () => {
        it('삭제된 계정을 정상적으로 복원', async () => {
            const recentlyDeleted = new Date();
            recentlyDeleted.setMonth(recentlyDeleted.getMonth() - 6);

            const deletedAccount = createMockAccount({
                deletedAt: recentlyDeleted,
            });

            mockPrismaClient.account.findFirst.mockResolvedValueOnce(deletedAccount);

            const caller = createPublicCaller();
            const result = await caller.auth.restoreAccount({
                name: deletedAccount.name,
                password: testPassword,
            });

            expect(result).toHaveProperty('accessToken');
            expect(result.name).toBe(deletedAccount.name);
            expect(result.displayName).toBe(deletedAccount.displayName);
        });
    });

    describe('예외 케이스', () => {
        it('삭제된 계정이 없으면 NOT_FOUND', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);

            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: 'nonexistent',
                    password: testPassword,
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('비밀번호 불일치 시 UNAUTHORIZED', async () => {
            const recentlyDeleted = new Date();
            recentlyDeleted.setMonth(recentlyDeleted.getMonth() - 6);

            const deletedAccount = createMockAccount({
                deletedAt: recentlyDeleted,
            });

            mockPrismaClient.account.findFirst.mockResolvedValueOnce(deletedAccount);

            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: deletedAccount.name,
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('2년 초과 삭제 계정은 FORBIDDEN', async () => {
            const expiredDate = new Date();
            expiredDate.setFullYear(expiredDate.getFullYear() - 3);

            const oldDeletedAccount = createMockAccount({
                deletedAt: expiredDate,
            });

            mockPrismaClient.account.findFirst.mockResolvedValueOnce(oldDeletedAccount);

            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: oldDeletedAccount.name,
                    password: testPassword,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });
});
