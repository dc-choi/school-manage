/**
 * 멤버 강퇴 통합 테스트 (실제 DB)
 *
 * organization.removeMember: ADMIN이 같은 조직 TEACHER를 조직에서 제거.
 */
import { type SeedBase, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { ROLE } from '@school/shared';
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

const createTeacher = async (orgId: bigint, name = '선생님') => {
    const now = getNowKST();
    return database.account.create({
        data: {
            name,
            displayName: name,
            password: TEST_PASSWORD_HASH,
            organizationId: orgId,
            role: ROLE.TEACHER,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
};

describe('organization.removeMember 통합 테스트', () => {
    it('ADMIN이 TEACHER 제거 -> 성공 + organizationId/role null + 스냅샷 1건', async () => {
        const teacher = await createTeacher(seed.org.id);

        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        const result = await caller.organization.removeMember({
            targetAccountId: String(teacher.id),
        });

        expect(result).toEqual({ success: true });

        const updated = await database.account.findFirst({ where: { id: teacher.id } });
        expect(updated?.organizationId).toBeNull();
        expect(updated?.role).toBeNull();
        expect(updated?.deletedAt).toBeNull();

        const snapshots = await database.accountSnapshot.findMany({ where: { accountId: teacher.id } });
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0]?.organizationId).toBe(seed.org.id);

        const remaining = await database.account.findMany({
            where: { organizationId: seed.org.id, deletedAt: null },
        });
        expect(remaining).toHaveLength(1);
        expect(remaining[0]?.id).toBe(seed.account.id);
    });

    it('TEACHER가 강퇴 시도 -> FORBIDDEN', async () => {
        const teacher = await createTeacher(seed.org.id);
        const otherTeacher = await createTeacher(seed.org.id, '다른선생님');

        const caller = createScopedCaller(String(teacher.id), teacher.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.TEACHER,
        });

        await expect(
            caller.organization.removeMember({ targetAccountId: String(otherTeacher.id) })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('자기 자신을 강퇴 시도 -> BAD_REQUEST', async () => {
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        await expect(caller.organization.removeMember({ targetAccountId: seed.ids.accountId })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });

    it('다른 ADMIN을 강퇴 시도 -> BAD_REQUEST', async () => {
        const now = getNowKST();
        const anotherAdmin = await database.account.create({
            data: {
                name: '다른관리자',
                displayName: '다른관리자',
                password: TEST_PASSWORD_HASH,
                organizationId: seed.org.id,
                role: ROLE.ADMIN,
                createdAt: now,
                privacyAgreedAt: now,
            },
        });

        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        await expect(
            caller.organization.removeMember({ targetAccountId: String(anotherAdmin.id) })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('다른 조직 멤버 강퇴 시도 -> NOT_FOUND', async () => {
        const otherOrg = await database.organization.create({
            data: { name: '다른모임', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: getNowKST() },
        });
        const outsideTeacher = await createTeacher(otherOrg.id, '외부선생님');

        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        await expect(
            caller.organization.removeMember({ targetAccountId: String(outsideTeacher.id) })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('이미 삭제된 계정 강퇴 시도 -> NOT_FOUND', async () => {
        const teacher = await createTeacher(seed.org.id);
        await database.account.update({
            where: { id: teacher.id },
            data: { deletedAt: getNowKST() },
        });

        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        await expect(caller.organization.removeMember({ targetAccountId: String(teacher.id) })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('강퇴 + 양도 동시 실행 -> ADMIN 부재 방지 (race 가드)', async () => {
        const teacher = await createTeacher(seed.org.id);
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.ADMIN,
        });

        const [removeResult, transferResult] = await Promise.allSettled([
            caller.organization.removeMember({ targetAccountId: String(teacher.id) }),
            caller.organization.transferAdmin({ targetAccountId: String(teacher.id) }),
        ]);

        const successCount = [removeResult, transferResult].filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBeGreaterThanOrEqual(1);

        const adminCount = await database.account.count({
            where: { organizationId: seed.org.id, role: ROLE.ADMIN, deletedAt: null },
        });
        expect(adminCount).toBeGreaterThanOrEqual(1);
    });
});
