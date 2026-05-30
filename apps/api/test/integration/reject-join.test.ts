/**
 * RejectJoin 통합 테스트 (실제 DB)
 *
 * 합류 요청 거부 + 동시 승인/거부 race 방어 (조건부 updateMany + count)
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { JOIN_REQUEST_STATUS, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import bcrypt from 'bcrypt';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

const createApplicantAndRequest = async () => {
    const now = getNowKST();
    const applicant = await database.account.create({
        data: {
            name: '신청자',
            displayName: '신청자',
            password: bcrypt.hashSync('5678', 10),
            role: null,
            organizationId: null,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const joinRequest = await database.joinRequest.create({
        data: {
            accountId: applicant.id,
            organizationId: seed.org.id,
            status: JOIN_REQUEST_STATUS.PENDING,
            pendingLock: true,
            createdAt: now,
            updatedAt: now,
        },
    });
    return { applicant, joinRequest };
};

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('organization.rejectJoin 통합 테스트', () => {
    it('TC-1: ADMIN이 PENDING 요청 거부 → REJECTED + pendingLock 해제', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await caller.organization.rejectJoin({ joinRequestId: String(joinRequest.id) });

        const updated = await database.joinRequest.findUnique({ where: { id: joinRequest.id } });
        expect(updated?.status).toBe(JOIN_REQUEST_STATUS.REJECTED);
        expect(updated?.pendingLock).toBeNull();
    });

    it('TC-2: non-admin(TEACHER) 요청 → FORBIDDEN', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.TEACHER,
        });

        await expect(caller.organization.rejectJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });

    it('TC-3: 존재하지 않는 joinRequestId → NOT_FOUND', async () => {
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.rejectJoin({ joinRequestId: '999999' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('TC-4: 다른 organization의 요청 → NOT_FOUND', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        const otherOrg = await database.organization.create({
            data: { name: '다른조직', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: getNowKST() },
        });
        const otherAdmin = await database.account.create({
            data: {
                name: '다른관리자',
                displayName: '다른관리자',
                password: bcrypt.hashSync('5678', 10),
                role: ROLE.ADMIN,
                organizationId: otherOrg.id,
                createdAt: getNowKST(),
                privacyAgreedAt: getNowKST(),
            },
        });
        const caller = createScopedCaller(String(otherAdmin.id), otherAdmin.name, String(otherOrg.id), otherOrg.name);

        await expect(caller.organization.rejectJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('TC-5: 이미 APPROVED된 요청 거부 → CONFLICT (조용한 APPROVED→REJECTED 덮어쓰기 차단)', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        await database.joinRequest.update({
            where: { id: joinRequest.id },
            data: { status: JOIN_REQUEST_STATUS.APPROVED, pendingLock: null, updatedAt: getNowKST() },
        });
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.rejectJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'CONFLICT',
        });

        // APPROVED 그대로 유지 (덮어쓰기 없음)
        const updated = await database.joinRequest.findUnique({ where: { id: joinRequest.id } });
        expect(updated?.status).toBe(JOIN_REQUEST_STATUS.APPROVED);
    });
});
