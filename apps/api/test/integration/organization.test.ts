/**
 * Organization 통합 테스트 (실제 DB)
 *
 * 조직 생성 시 동일 이름 차단, 타입 필수 입력, 페이지네이션 검증
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

describe('organization 통합 테스트', () => {
    describe('organization.list', () => {
        it('TC-1: page 미지정 시 1페이지 반환, pagination 메타데이터 포함', async () => {
            // seedBase가 이미 1개 생성, 2개 더 추가
            const now = getNowKST();
            await database.organization.create({
                data: { name: '초등부', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: now },
            });
            await database.organization.create({
                data: { name: '청년부', type: 'YOUNG_ADULT', churchId: seed.church.id, createdAt: now },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.organization.list({ churchId: seed.ids.churchId });

            expect(result.page).toBe(1);
            expect(result.size).toBe(10);
            expect(result.total).toBe(3);
            expect(result.totalPage).toBe(1);
            expect(result.organizations).toHaveLength(3);
        });

        it('TC-E1: 조직 0건 → 빈 배열, total=0, totalPage=0', async () => {
            // 다른 Church (조직 없음)
            const otherChurch = await database.church.create({
                data: { name: '빈성당', parishId: seed.parish.id, createdAt: getNowKST() },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.organization.list({ churchId: String(otherChurch.id) });

            expect(result.organizations).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.totalPage).toBe(0);
        });
    });

    describe('organization.create', () => {
        it('고유 이름으로 조직 생성 성공', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.organization.create({
                churchId: seed.ids.churchId,
                name: '초등부',
                type: 'ELEMENTARY',
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name', '초등부');
            expect(result).toHaveProperty('type', 'ELEMENTARY');
        });

        it('같은 Church 내 동일 이름 조직 생성 시 CONFLICT 에러', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            // seed에서 이미 '장위동 중고등부' 생성됨
            await expect(
                caller.organization.create({
                    churchId: seed.ids.churchId,
                    name: '장위동 중고등부',
                    type: 'MIDDLE_HIGH',
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('다른 Church에서 동일 이름 조직 생성 허용', async () => {
            const otherChurch = await database.church.create({
                data: { name: '다른성당', parishId: seed.parish.id, createdAt: getNowKST() },
            });

            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.organization.create({
                churchId: String(otherChurch.id),
                name: '장위동 중고등부',
                type: 'MIDDLE_HIGH',
            });

            expect(result).toHaveProperty('name', '장위동 중고등부');
        });

        it('type 미전송 시 BAD_REQUEST 에러', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            await expect(
                caller.organization.create({ churchId: seed.ids.churchId, name: '테스트' } as any)
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(
                caller.organization.create({
                    churchId: seed.ids.churchId,
                    name: '테스트',
                    type: 'MIDDLE_HIGH',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });
});
