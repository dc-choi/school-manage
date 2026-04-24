/**
 * Account 통합 테스트 (실제 DB)
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { CURRENT_PRIVACY_VERSION } from '@school/shared';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('account 통합 테스트', () => {
    describe('account.get', () => {
        it('인증된 사용자 정보 반환', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.get();

            expect(result).toHaveProperty('name');
            expect(result.name).toBe(seed.account.name);
        });

        it('응답에 privacyPolicyVersion 포함 (현재 버전)', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.get();

            expect(result.privacyPolicyVersion).toBe(CURRENT_PRIVACY_VERSION);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.account.get()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('account.agreePrivacy — 버전 관리', () => {
        it('구버전 동의자 재동의 시 CURRENT_PRIVACY_VERSION으로 업그레이드', async () => {
            // seed 계정을 v1 (구버전)로 되돌림
            await database.account.update({
                where: { id: seed.account.id },
                data: { privacyPolicyVersion: 1, privacyAgreedAt: getNowKST() },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.agreePrivacy();

            expect(result.privacyPolicyVersion).toBe(CURRENT_PRIVACY_VERSION);
            const dbAccount = await database.account.findUnique({ where: { id: seed.account.id } });
            expect(dbAccount?.privacyPolicyVersion).toBe(CURRENT_PRIVACY_VERSION);
        });

        it('최신 버전 동의자는 멱등 (기존 값 반환)', async () => {
            const before = await database.account.findUnique({ where: { id: seed.account.id } });
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.agreePrivacy();

            expect(result.privacyPolicyVersion).toBe(CURRENT_PRIVACY_VERSION);
            // privacyAgreedAt은 기존 값 그대로 (update 안 함)
            expect(result.privacyAgreedAt.getTime()).toBe(before!.privacyAgreedAt!.getTime());
        });

        it('미동의 상태에서 동의 시 현재 버전으로 기록', async () => {
            // seed 계정을 미동의 상태로
            await database.account.update({
                where: { id: seed.account.id },
                data: { privacyAgreedAt: null, privacyPolicyVersion: 1 },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.agreePrivacy();

            expect(result.privacyPolicyVersion).toBe(CURRENT_PRIVACY_VERSION);
            expect(result.privacyAgreedAt).toBeTruthy();
        });
    });
});
