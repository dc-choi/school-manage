/**
 * Church 통합 테스트 (실제 DB)
 *
 * 본당 생성 시 동일 이름 차단 검증
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
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

describe('church 통합 테스트', () => {
    describe('church.create', () => {
        it('고유 이름으로 본당 생성 성공', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.church.create({ parishId: seed.ids.parishId, name: '양재성당' });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name', '양재성당');
            expect(result).toHaveProperty('parishId', seed.ids.parishId);
        });

        it('같은 Parish 내 동일 이름 본당 생성 시 CONFLICT 에러', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            await expect(
                caller.church.create({ parishId: seed.ids.parishId, name: '장위동성당' })
            ).rejects.toMatchObject({
                code: 'CONFLICT',
            });
        });

        it('다른 Parish에서 동일 이름 본당 생성 허용', async () => {
            const otherParish = await database.parish.create({
                data: { name: '수원교구', createdAt: getNowKST() },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.church.create({
                parishId: String(otherParish.id),
                name: '장위동성당',
            });

            expect(result).toHaveProperty('name', '장위동성당');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(
                caller.church.create({ parishId: seed.ids.parishId, name: '테스트성당' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
