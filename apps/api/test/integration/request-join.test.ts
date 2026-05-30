/**
 * RequestJoin 통합 테스트 (실제 DB)
 *
 * 미소속 계정 단일 PENDING 강제 (A-3) — 다중 조직 동시 합류 요청 차단
 */
import { type SeedBase, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createAuthenticatedCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { JOIN_REQUEST_STATUS } from '@school/shared';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

/** 미소속(organizationId=null) 신청자 계정 생성 */
const createApplicant = async () => {
    const now = getNowKST();
    return database.account.create({
        data: {
            name: '신청자',
            displayName: '신청자',
            password: TEST_PASSWORD_HASH,
            role: null,
            organizationId: null,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
};

/** 합류 요청 레코드 생성 (기본 PENDING) */
const createRequest = async (
    accountId: bigint,
    organizationId: bigint,
    status: string = JOIN_REQUEST_STATUS.PENDING
) => {
    const now = getNowKST();
    return database.joinRequest.create({
        data: { accountId, organizationId, status, createdAt: now, updatedAt: now },
    });
};

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('organization.requestJoin 통합 테스트 (A-3 단일 PENDING 강제)', () => {
    it('TC-1: PENDING 없는 미소속 계정 합류 요청 → 생성 성공', async () => {
        const applicant = await createApplicant();
        const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);

        const result = await caller.organization.requestJoin({ organizationId: seed.ids.orgId });

        expect(result.joinRequestId).toBeDefined();
        const pendingCount = await database.joinRequest.count({
            where: { accountId: applicant.id, status: JOIN_REQUEST_STATUS.PENDING },
        });
        expect(pendingCount).toBe(1);
    });

    it('TC-2: 과거 REJECTED 이력만 보유 → 신규 요청 정상 생성 (PENDING만 차단)', async () => {
        const applicant = await createApplicant();
        await createRequest(applicant.id, seed.org.id, JOIN_REQUEST_STATUS.REJECTED);
        const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);

        const result = await caller.organization.requestJoin({ organizationId: seed.ids.orgId });

        expect(result.joinRequestId).toBeDefined();
        const pendingCount = await database.joinRequest.count({
            where: { accountId: applicant.id, status: JOIN_REQUEST_STATUS.PENDING },
        });
        expect(pendingCount).toBe(1);
    });

    it('TC-E1: 같은 조직에 PENDING 보유 상태 재요청 → CONFLICT', async () => {
        const applicant = await createApplicant();
        await createRequest(applicant.id, seed.org.id);
        const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);

        await expect(caller.organization.requestJoin({ organizationId: seed.ids.orgId })).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'CONFLICT: 이미 진행 중인 합류 요청이 있습니다',
        });
    });

    it('TC-E2: 다른 조직에 PENDING 보유 상태에서 신규 조직 요청 → CONFLICT (다중 PENDING 차단)', async () => {
        const applicant = await createApplicant();
        await createRequest(applicant.id, seed.org.id); // 조직 A에 PENDING
        const otherOrg = await database.organization.create({
            data: { name: '다른조직', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: getNowKST() },
        });
        const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);

        await expect(caller.organization.requestJoin({ organizationId: String(otherOrg.id) })).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'CONFLICT: 이미 진행 중인 합류 요청이 있습니다',
        });

        // 신규 요청이 생성되지 않고 기존 PENDING 1건만 유지되는지 확인
        const total = await database.joinRequest.count({ where: { accountId: applicant.id } });
        expect(total).toBe(1);
        const remaining = await database.joinRequest.findFirst({ where: { accountId: applicant.id } });
        expect(remaining?.organizationId).toBe(seed.org.id);
    });

    it('TC-E3: 이미 조직에 소속된 계정 요청 → CONFLICT (이미 소속)', async () => {
        // seed.account는 organizationId 보유 (소속). consented 경로를 통과하는 scoped caller로 호출
        const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

        await expect(caller.organization.requestJoin({ organizationId: seed.ids.orgId })).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'CONFLICT: 이미 조직에 소속되어 있습니다',
        });
    });

    it('TC-E4: 동일 미소속 계정 동시 요청 → 정확히 1건만 성공, 나머지 CONFLICT, PENDING 1건 (race 백스톱)', async () => {
        const applicant = await createApplicant();
        const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);

        // 5개의 동시 합류 요청 발사 — (accountId, pendingLock) UNIQUE 제약으로 1건만 성공해야 함
        const results = await Promise.allSettled(
            Array.from({ length: 5 }, () => caller.organization.requestJoin({ organizationId: seed.ids.orgId }))
        );

        const fulfilled = results.filter((r) => r.status === 'fulfilled');
        const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(4);
        for (const r of rejected) {
            expect(r.reason).toMatchObject({ code: 'CONFLICT' });
        }

        const pendingCount = await database.joinRequest.count({
            where: { accountId: applicant.id, status: JOIN_REQUEST_STATUS.PENDING },
        });
        expect(pendingCount).toBe(1);
    });
});
