/**
 * Account 통합 테스트 (실제 DB)
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

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

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.account.get()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
