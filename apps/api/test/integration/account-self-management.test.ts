/**
 * 계정 자기 관리 통합 테스트 (tRPC + Prisma Mocking)
 *
 * TC-SM1 ~ TC-SM7, TC-SME1: 비밀번호 재설정/변경, 프로필 수정, 계정 삭제
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { getTestAccount, testPassword } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// mailService mock import (vi.mock 호이스팅 후 참조)
import { mailService } from '~/infrastructure/mail/mail.service.js';

// mailService mock
vi.mock('~/infrastructure/mail/mail.service.js', () => ({
    mailService: {
        isEnabled: vi.fn().mockReturnValue(true),
        sendTemporaryPassword: vi.fn().mockResolvedValue(true),
    },
}));

const mockMailService = mailService as unknown as {
    isEnabled: ReturnType<typeof vi.fn>;
    sendTemporaryPassword: ReturnType<typeof vi.fn>;
};

describe('계정 자기 관리 통합 테스트', () => {
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const accountName = testAccount.name;

    beforeEach(() => {
        // Prisma mock 초기화
        mockPrismaClient.account.findFirst.mockReset();
        mockPrismaClient.account.update.mockReset();

        // mailService mock 초기화
        mockMailService.isEnabled.mockReturnValue(true);
        mockMailService.sendTemporaryPassword.mockReset().mockResolvedValue(true);
    });

    // ================================================================
    // auth.resetPassword
    // ================================================================
    describe('auth.resetPassword', () => {
        it('TC-SM1: 존재하는 계정 → success, 메일 발송, DB 업데이트', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({ id: testAccount.id });
            mockPrismaClient.account.update.mockResolvedValueOnce({});

            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: testAccount.name,
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: true });
            expect(mockMailService.sendTemporaryPassword).toHaveBeenCalledOnce();
            expect(mockMailService.sendTemporaryPassword).toHaveBeenCalledWith('test@example.com', expect.any(String));
            expect(mockPrismaClient.account.update).toHaveBeenCalledOnce();
        });

        it('TC-SM2: 미존재 계정 → success, 메일 미발송', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce(null);

            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: 'nonexistent',
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: true });
            expect(mockMailService.sendTemporaryPassword).not.toHaveBeenCalled();
        });

        it('TC-SME1: SMTP 미설정 → success, DB 미업데이트', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({ id: testAccount.id });
            // SMTP 미설정 시 sendTemporaryPassword가 false 반환
            mockMailService.sendTemporaryPassword.mockResolvedValueOnce(false);

            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: testAccount.name,
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: false, emailFailed: true });
            expect(mockPrismaClient.account.update).not.toHaveBeenCalled();
        });
    });

    // ================================================================
    // account.changePassword
    // ================================================================
    describe('account.changePassword', () => {
        beforeEach(() => {
            mockPrismaClient.$transaction = vi.fn().mockResolvedValue([{}, { count: 0 }]);
        });

        it('TC-SM3: 정상 비밀번호 변경 → success', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.account.changePassword({
                currentPassword: testPassword,
                newPassword: 'newpassword123',
            });

            expect(result).toEqual({ success: true });
            expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
        });

        it('TC-SM4: 현재 비밀번호 불일치 → UNAUTHORIZED', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.account.changePassword({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    // ================================================================
    // account.updateProfile
    // ================================================================
    describe('account.updateProfile', () => {
        it('TC-SM5: 이름 변경 → { displayName: "새이름" }', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({ id: BigInt(accountId) });
            mockPrismaClient.account.update.mockResolvedValueOnce({ displayName: '새이름' });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.account.updateProfile({
                displayName: '새이름',
            });

            expect(result).toEqual({ displayName: '새이름' });
        });
    });

    // ================================================================
    // account.deleteAccount
    // ================================================================
    describe('account.deleteAccount', () => {
        // $transaction mock: 콜백을 실행하는 구현 (계정 soft-delete + RefreshToken 삭제만)
        const mockTx = {
            account: {
                update: vi.fn().mockResolvedValue({}),
            },
            refreshToken: {
                deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
        };

        beforeEach(() => {
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockTx));

            // mockTx 초기화
            mockTx.account.update.mockReset().mockResolvedValue({});
            mockTx.refreshToken.deleteMany.mockReset().mockResolvedValue({ count: 0 });
        });

        it('TC-SM6: 정상 삭제 → success, $transaction 호출', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const caller = createAuthenticatedCaller(accountId, accountName);
            const result = await caller.account.deleteAccount({
                password: testPassword,
            });

            expect(result).toEqual({ success: true });
            expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
        });

        it('TC-SM7: 비밀번호 불일치 → UNAUTHORIZED', async () => {
            mockPrismaClient.account.findFirst.mockResolvedValueOnce({
                id: testAccount.id,
                password: testAccount.password,
            });

            const caller = createAuthenticatedCaller(accountId, accountName);

            await expect(
                caller.account.deleteAccount({
                    password: 'wrongpassword',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
