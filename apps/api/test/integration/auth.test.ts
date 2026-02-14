/**
 * Auth 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 로그인 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { getTestAccount, testPassword } from '../helpers/mock-data.ts';
import { createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it } from 'vitest';

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
    });
});
