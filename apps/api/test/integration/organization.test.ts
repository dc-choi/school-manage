/**
 * Organization 통합 테스트 (실제 DB)
 *
 * 조직 생성 시 동일 이름 차단, 소속 계정 생성 차단(A-4 가드), 타입 필수 입력, 페이지네이션 검증
 */
import { type SeedBase, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

/**
 * 미소속 계정 생성 — organization.create는 미소속 계정만 허용 (A-4 소속 가드)
 */
const createUnorganizedAccount = async (name: string) => {
    const now = getNowKST();
    return database.account.create({
        data: {
            name,
            displayName: name,
            password: TEST_PASSWORD_HASH,
            organizationId: null,
            role: null,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
};

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
        it('미소속 계정이 고유 이름으로 조직 생성 성공 + ADMIN 배정 + 스냅샷 기록', async () => {
            const creator = await createUnorganizedAccount('미소속생성자');
            const caller = createAuthenticatedCaller(String(creator.id), creator.name);
            const result = await caller.organization.create({
                churchId: seed.ids.churchId,
                name: '초등부',
                type: 'ELEMENTARY',
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name', '초등부');
            expect(result).toHaveProperty('type', 'ELEMENTARY');

            const account = await database.account.findUnique({ where: { id: creator.id } });
            expect(account!.organizationId).toBe(BigInt(result.id));
            expect(account!.role).toBe(ROLE.ADMIN);

            const snapshot = await database.accountSnapshot.findFirst({ where: { accountId: creator.id } });
            expect(snapshot!.organizationId).toBe(BigInt(result.id));
        });

        it('같은 Church 내 동일 이름 조직 생성 시 CONFLICT 에러', async () => {
            const creator = await createUnorganizedAccount('미소속생성자');
            const caller = createAuthenticatedCaller(String(creator.id), creator.name);

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

            const creator = await createUnorganizedAccount('미소속생성자');
            const caller = createAuthenticatedCaller(String(creator.id), creator.name);
            const result = await caller.organization.create({
                churchId: String(otherChurch.id),
                name: '장위동 중고등부',
                type: 'MIDDLE_HIGH',
            });

            expect(result).toHaveProperty('name', '장위동 중고등부');
        });

        it('TC-E1: 소속 TEACHER가 조직 생성 시 CONFLICT + 조직 미생성 + 기존 소속 불변', async () => {
            const now = getNowKST();
            const teacher = await database.account.create({
                data: {
                    name: '소속교사',
                    displayName: '소속교사',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.TEACHER,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const caller = createAuthenticatedCaller(String(teacher.id), teacher.name);
            await expect(
                caller.organization.create({
                    churchId: seed.ids.churchId,
                    name: '신규조직',
                    type: 'ELEMENTARY',
                })
            ).rejects.toMatchObject({
                code: 'CONFLICT',
                message: expect.stringContaining('이미 조직에 소속'),
            });

            // 트랜잭션 롤백 — 조직 미생성
            const org = await database.organization.findFirst({ where: { name: '신규조직' } });
            expect(org).toBeNull();

            // 기존 소속/역할 불변
            const account = await database.account.findUnique({ where: { id: teacher.id } });
            expect(account!.organizationId).toBe(seed.org.id);
            expect(account!.role).toBe(ROLE.TEACHER);
        });

        it('TC-E2: 유일 ADMIN이 조직 생성 시 CONFLICT — 기존 조직 관리자 0명 고아화 방지', async () => {
            // seed 계정 = seed 조직의 유일 ADMIN
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            await expect(
                caller.organization.create({
                    churchId: seed.ids.churchId,
                    name: '신규조직',
                    type: 'MIDDLE_HIGH',
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            // 기존 조직의 ADMIN 1명 유지 (ADMIN>=1 불변식)
            const adminCount = await database.account.count({
                where: { organizationId: seed.org.id, role: ROLE.ADMIN, deletedAt: null },
            });
            expect(adminCount).toBe(1);

            const org = await database.organization.findFirst({ where: { name: '신규조직' } });
            expect(org).toBeNull();
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
