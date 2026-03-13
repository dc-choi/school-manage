/**
 * Refresh Token 통합 테스트 (tRPC + Prisma Mocking)
 *
 * RTR (Refresh Token Rotation), 로그아웃, 탈취 감지 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { getTestAccount } from '../helpers/mock-data.ts';
import { createCallerWithContext } from '../helpers/trpc-caller.ts';
import type { Context } from '@school/trpc';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashRefreshToken } from '~/domains/auth/utils/refresh-token.utils.js';

// 쿠키 동작을 추적하기 위한 Mock Response
function createMockResWithCookies() {
    const cookies: Record<string, string> = {};
    const cleared: string[] = [];
    return {
        res: {
            cookie: vi.fn((name: string, value: string) => {
                cookies[name] = value;
            }),
            clearCookie: vi.fn((name: string) => {
                cleared.push(name);
                delete cookies[name];
            }),
        } as unknown as Response,
        cookies,
        cleared,
    };
}

function createMockReqWithCookie(cookieValue?: string): Request {
    return {
        cookies: cookieValue ? { refresh_token: cookieValue } : {},
    } as unknown as Request;
}

describe('auth.refresh 통합 테스트', () => {
    const testAccount = getTestAccount();

    beforeEach(() => {
        mockPrismaClient.refreshToken.findFirst.mockReset();
        mockPrismaClient.refreshToken.delete.mockReset();
        mockPrismaClient.refreshToken.create.mockReset().mockResolvedValue({});
        mockPrismaClient.refreshToken.deleteMany.mockReset().mockResolvedValue({ count: 0 });
        mockPrismaClient.account.findFirst.mockReset();
        mockPrismaClient.$transaction = vi.fn().mockResolvedValue([{}, {}, { count: 0 }]);
    });

    it('TC-1: 유효한 RT로 refresh → 새 AT + 쿠키에 새 RT', async () => {
        const rawToken = 'valid-refresh-token-hex';
        const tokenHash = hashRefreshToken(rawToken);
        const storedToken = {
            id: BigInt(1),
            accountId: testAccount.id,
            tokenHash,
            familyId: 'family-uuid-1',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
            createdAt: new Date(),
        };

        mockPrismaClient.refreshToken.findFirst.mockResolvedValueOnce(storedToken);
        mockPrismaClient.account.findFirst.mockResolvedValueOnce(testAccount);

        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(rawToken);

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);
        const result = await caller.auth.refresh();

        expect(result).toHaveProperty('accessToken');
        expect(typeof result.accessToken).toBe('string');
        expect(res.cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
    });

    it('TC-2: 쿠키 없음 → UNAUTHORIZED', async () => {
        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(); // 쿠키 없음

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('TC-3: DB에 없는 RT (탈취/이미 회전) → UNAUTHORIZED + 쿠키 삭제', async () => {
        const rawToken = 'stolen-or-rotated-token';

        mockPrismaClient.refreshToken.findFirst.mockResolvedValueOnce(null);

        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(rawToken);

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });

    it('TC-4: 만료된 RT → UNAUTHORIZED + 쿠키 삭제 + DB 삭제', async () => {
        const rawToken = 'expired-refresh-token';
        const tokenHash = hashRefreshToken(rawToken);
        const expiredToken = {
            id: BigInt(2),
            accountId: testAccount.id,
            tokenHash,
            familyId: 'family-uuid-2',
            expiresAt: new Date(Date.now() - 1000), // 만료됨
            createdAt: new Date(),
        };

        mockPrismaClient.refreshToken.findFirst.mockResolvedValueOnce(expiredToken);
        mockPrismaClient.refreshToken.delete.mockResolvedValueOnce({});

        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(rawToken);

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(res.clearCookie).toHaveBeenCalled();
        expect(mockPrismaClient.refreshToken.delete).toHaveBeenCalledWith({
            where: { id: expiredToken.id },
        });
    });

    it('TC-5: 삭제된 계정 → UNAUTHORIZED + 해당 계정 모든 RT 삭제', async () => {
        const rawToken = 'valid-token-deleted-account';
        const tokenHash = hashRefreshToken(rawToken);
        const storedToken = {
            id: BigInt(3),
            accountId: testAccount.id,
            tokenHash,
            familyId: 'family-uuid-3',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
            createdAt: new Date(),
        };

        mockPrismaClient.refreshToken.findFirst.mockResolvedValueOnce(storedToken);
        mockPrismaClient.account.findFirst.mockResolvedValueOnce(null); // 계정 없음

        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(rawToken);

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(mockPrismaClient.refreshToken.deleteMany).toHaveBeenCalledWith({
            where: { accountId: storedToken.accountId },
        });
    });
});

describe('auth.logout 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.refreshToken.findFirst.mockReset();
        mockPrismaClient.refreshToken.deleteMany.mockReset().mockResolvedValue({ count: 0 });
    });

    it('TC-6: 유효한 RT로 로그아웃 → family 전체 삭제 + 쿠키 삭제', async () => {
        const rawToken = 'logout-refresh-token';
        const tokenHash = hashRefreshToken(rawToken);

        mockPrismaClient.refreshToken.findFirst.mockResolvedValueOnce({
            familyId: 'logout-family-uuid',
        });

        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(rawToken);

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);
        const result = await caller.auth.logout();

        expect(result).toEqual({ success: true });
        expect(mockPrismaClient.refreshToken.deleteMany).toHaveBeenCalledWith({
            where: { familyId: 'logout-family-uuid' },
        });
        expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });

    it('TC-7: 쿠키 없이 로그아웃 → success (graceful)', async () => {
        const { res } = createMockResWithCookies();
        const req = createMockReqWithCookie(); // 쿠키 없음

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);
        const result = await caller.auth.logout();

        expect(result).toEqual({ success: true });
        expect(res.clearCookie).toHaveBeenCalled();
    });
});
