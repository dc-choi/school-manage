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

        it('공백 변형(공백 위치/개수만 다름) 본당 생성 시 CONFLICT 에러', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            // seedBase가 '장위동성당'을 생성 → '장위동 성당'은 정규화 시 동일
            await expect(
                caller.church.create({ parishId: seed.ids.parishId, name: '장위동 성당' })
            ).rejects.toMatchObject({
                code: 'CONFLICT',
            });
        });

        it('글자가 다른 본당은 별개로 생성 허용 (유사명 병합 안 함)', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            const first = await caller.church.create({
                parishId: seed.ids.parishId,
                name: '반포동성당',
            });
            const second = await caller.church.create({
                parishId: seed.ids.parishId,
                name: '반포4동성당',
            });

            expect(first.name).toBe('반포동성당');
            expect(second.name).toBe('반포4동성당');
        });

        it('공백만 입력 시 BAD_REQUEST 에러', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            await expect(caller.church.create({ parishId: seed.ids.parishId, name: '   ' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
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

    describe('church.search', () => {
        it('검색어 공백 변형 무관하게 매칭한다', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            await caller.church.create({ parishId: seed.ids.parishId, name: '반포동성당' });

            const result = await caller.church.search({
                parishId: seed.ids.parishId,
                query: '반포동 성당',
            });

            expect(result.churches.some((c) => c.name === '반포동성당')).toBe(true);
        });
    });
});
