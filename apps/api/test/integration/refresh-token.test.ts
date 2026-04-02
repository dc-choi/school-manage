/**
 * Refresh Token 통합 테스트 (실제 DB)
 *
 * RTR (Refresh Token Rotation), 로그아웃, 탈취 감지 테스트
 */
import { type SeedBase, TEST_PASSWORD, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createMockReq, createMockRes } from '../helpers/test-stubs.ts';
import { createCallerWithContext, createPublicCaller } from '../helpers/trpc-caller.ts';
import type { Context } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
    generateFamilyId,
    generateRefreshToken,
    getRefreshTokenExpiry,
    hashRefreshToken,
} from '~/domains/auth/utils/refresh-token.utils.js';
// database를 먼저 import (env.ts 순환 의존성 해소: env → utils/index → ownership → database → env)
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('auth.refresh 통합 테스트', () => {
    /**
     * DB에 Refresh Token을 직접 생성하고 raw token을 반환
     */
    async function createStoredRefreshToken(
        accountId: bigint,
        options?: { expired?: boolean }
    ): Promise<{ rawToken: string; familyId: string }> {
        const rawToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(rawToken);
        const familyId = generateFamilyId();
        const now = getNowKST();

        const expiresAt = options?.expired
            ? new Date(now.getTime() - 1000) // 이미 만료
            : getRefreshTokenExpiry();

        await database.refreshToken.create({
            data: {
                accountId,
                tokenHash,
                familyId,
                expiresAt,
                createdAt: now,
            },
        });

        return { rawToken, familyId };
    }

    it('TC-1: 유효한 RT로 refresh → 새 AT + 쿠키에 새 RT', async () => {
        const { rawToken } = await createStoredRefreshToken(seed.account.id);

        const res = createMockRes();
        const req = createMockReq({ refresh_token: rawToken });
        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        const result = await caller.auth.refresh();

        expect(result).toHaveProperty('accessToken');
        expect(typeof result.accessToken).toBe('string');
        expect(res.cookie).toHaveBeenCalledWith('refresh_token', expect.any(String), expect.any(Object));
    });

    it('TC-2: 쿠키 없음 → UNAUTHORIZED', async () => {
        const res = createMockRes();
        const req = createMockReq(); // 쿠키 없음

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('TC-3: DB에 없는 RT (탈취/이미 회전) → UNAUTHORIZED + 쿠키 삭제', async () => {
        const res = createMockRes();
        const req = createMockReq({ refresh_token: 'stolen-or-rotated-token' });

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });

    it('TC-4: 만료된 RT → UNAUTHORIZED + 쿠키 삭제 + DB 삭제', async () => {
        const { rawToken } = await createStoredRefreshToken(seed.account.id, {
            expired: true,
        });

        const res = createMockRes();
        const req = createMockReq({ refresh_token: rawToken });

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(res.clearCookie).toHaveBeenCalled();

        // DB에서 삭제되었는지 확인
        const tokenHash = hashRefreshToken(rawToken);
        const remaining = await database.refreshToken.findFirst({
            where: { tokenHash },
        });
        expect(remaining).toBeNull();
    });

    it('TC-5: 삭제된 계정 → UNAUTHORIZED + 해당 계정 모든 RT 삭제', async () => {
        // 계정을 소프트 삭제 처리
        await database.account.update({
            where: { id: seed.account.id },
            data: { deletedAt: getNowKST() },
        });

        const { rawToken } = await createStoredRefreshToken(seed.account.id);

        const res = createMockRes();
        const req = createMockReq({ refresh_token: rawToken });

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);

        await expect(caller.auth.refresh()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });

        // 해당 계정의 모든 RT가 삭제되었는지 확인
        const remainingTokens = await database.refreshToken.findMany({
            where: { accountId: seed.account.id },
        });
        expect(remainingTokens).toHaveLength(0);
    });
});

describe('auth.logout 통합 테스트', () => {
    it('TC-6: 유효한 RT로 로그아웃 → family 전체 삭제 + 쿠키 삭제', async () => {
        // 로그인으로 RT 생성
        const rawToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(rawToken);
        const familyId = generateFamilyId();
        const now = getNowKST();

        await database.refreshToken.create({
            data: {
                accountId: seed.account.id,
                tokenHash,
                familyId,
                expiresAt: getRefreshTokenExpiry(),
                createdAt: now,
            },
        });

        const res = createMockRes();
        const req = createMockReq({ refresh_token: rawToken });

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);
        const result = await caller.auth.logout();

        expect(result).toEqual({ success: true });
        expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));

        // family의 모든 RT가 삭제되었는지 확인
        const remaining = await database.refreshToken.findMany({
            where: { familyId },
        });
        expect(remaining).toHaveLength(0);
    });

    it('TC-7: 쿠키 없이 로그아웃 → success (graceful)', async () => {
        const res = createMockRes();
        const req = createMockReq(); // 쿠키 없음

        const ctx: Context = { req, res };
        const caller = createCallerWithContext(ctx);
        const result = await caller.auth.logout();

        expect(result).toEqual({ success: true });
        expect(res.clearCookie).toHaveBeenCalled();
    });
});
