/**
 * ApproveJoin 통합 테스트 (실제 DB)
 *
 * 합류 요청 승인 플로우 + TOCTOU 레이스 컨디션 방어 검증
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

describe('organization.approveJoin 통합 테스트', () => {
    it('TC-1: ADMIN이 PENDING 요청 승인 → APPROVED + 계정 조직 할당 + 스냅샷 생성', async () => {
        const { applicant, joinRequest } = await createApplicantAndRequest();
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) });

        const updatedRequest = await database.joinRequest.findUnique({ where: { id: joinRequest.id } });
        expect(updatedRequest?.status).toBe(JOIN_REQUEST_STATUS.APPROVED);

        const updatedAccount = await database.account.findUnique({ where: { id: applicant.id } });
        expect(updatedAccount?.organizationId).toBe(seed.org.id);
        expect(updatedAccount?.role).toBe(ROLE.TEACHER);

        const snapshots = await database.accountSnapshot.findMany({ where: { accountId: applicant.id } });
        expect(snapshots).toHaveLength(1);
    });

    it('TC-2: non-admin(TEACHER) 요청 → FORBIDDEN', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
            role: ROLE.TEACHER,
        });

        await expect(caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });

    it('TC-3: 존재하지 않는 joinRequestId → NOT_FOUND', async () => {
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.approveJoin({ joinRequestId: '999999' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('TC-4: 다른 organization의 joinRequest → NOT_FOUND', async () => {
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

        await expect(caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('TC-5: 이미 APPROVED된 요청 재승인 → CONFLICT', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        await database.joinRequest.update({
            where: { id: joinRequest.id },
            data: { status: JOIN_REQUEST_STATUS.APPROVED, updatedAt: getNowKST() },
        });
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
    });

    it('TC-6: 이미 REJECTED된 요청 승인 → CONFLICT', async () => {
        const { joinRequest } = await createApplicantAndRequest();
        await database.joinRequest.update({
            where: { id: joinRequest.id },
            data: { status: JOIN_REQUEST_STATUS.REJECTED, updatedAt: getNowKST() },
        });
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
    });

    // 핵심 TOCTOU 방어 케이스
    it('TC-E1: 동시 승인 시 정확히 1건만 성공, 나머지는 CONFLICT — account/snapshot 중복 없음', async () => {
        const { applicant, joinRequest } = await createApplicantAndRequest();
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        // 5개의 동시 승인 요청 발사 (InnoDB 행 잠금으로 직렬화되나 결과는 1개만 성공해야 함)
        const results = await Promise.allSettled(
            Array.from({ length: 5 }, () => caller.organization.approveJoin({ joinRequestId: String(joinRequest.id) }))
        );

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(4);
        for (const r of rejected) {
            expect(r.reason).toMatchObject({ code: 'CONFLICT' });
        }

        const updatedRequest = await database.joinRequest.findUnique({ where: { id: joinRequest.id } });
        expect(updatedRequest?.status).toBe(JOIN_REQUEST_STATUS.APPROVED);

        const updatedAccount = await database.account.findUnique({ where: { id: applicant.id } });
        expect(updatedAccount?.organizationId).toBe(seed.org.id);
        expect(updatedAccount?.role).toBe(ROLE.TEACHER);

        // 스냅샷은 성공한 트랜잭션에서 단 1번만 생성되어야 함
        const snapshots = await database.accountSnapshot.findMany({ where: { accountId: applicant.id } });
        expect(snapshots).toHaveLength(1);
    });
});
