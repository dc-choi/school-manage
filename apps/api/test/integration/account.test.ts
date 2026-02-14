/**
 * Account 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 계정 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { getTestAccount } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it } from 'vitest';

describe('account 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.account.findFirst.mockReset();
    });

    describe('account.get', () => {
        it('인증된 사용자 정보 반환', async () => {
            const testAccount = getTestAccount();
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(testAccount);

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);

            const result = await caller.account.get();

            // GetAccountUseCase는 name만 반환 (id 미포함)
            expect(result).toHaveProperty('name');
            expect(result.name).toBe(testAccount.name);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.account.get()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
