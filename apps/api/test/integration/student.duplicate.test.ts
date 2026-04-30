/**
 * Student 중복 등록 검증 통합 테스트 (로드맵 2단계 — 학생 등록 중복 확인)
 *
 * 단건/일괄 등록 + 사전 검증 query에 대한 TC-1 ~ TC-12 매핑.
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;
let groupId: string;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
    const group = await database.group.create({
        data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: getNowKST() },
    });
    groupId = String(group.id);
});

afterAll(async () => {
    await truncateAll();
});

const insertStudent = async (
    societyName: string,
    catholicName: string | null,
    overrides: Partial<{ deletedAt: Date; graduatedAt: Date }> = {}
) => {
    const now = getNowKST();
    const s = await database.student.create({
        data: {
            societyName,
            catholicName,
            organizationId: seed.org.id,
            createdAt: now,
            deletedAt: overrides.deletedAt ?? null,
            graduatedAt: overrides.graduatedAt ?? null,
        },
    });
    await database.studentGroup.create({
        data: { studentId: s.id, groupId: BigInt(groupId), createdAt: now },
    });
    return s;
};

describe('학생 등록 중복 확인 통합 테스트', () => {
    describe('정상 케이스', () => {
        it('TC-1: 단건 신규 등록 → 충돌 없음, 200', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.create({
                societyName: '신규학생',
                catholicName: '베드로',
                groupIds: [groupId],
            });
            expect(result.societyName).toBe('신규학생');
        });

        it('TC-2: 일괄 신규 등록 → successCount=N, skipped=[]', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCreate({
                students: [
                    { societyName: '학생1', groupIds: [groupId] },
                    { societyName: '학생2', groupIds: [groupId] },
                    { societyName: '학생3', groupIds: [groupId] },
                ],
            });
            expect(result.successCount).toBe(3);
            expect(result.totalCount).toBe(3);
            expect(result.skipped).toEqual([]);
        });

        it('TC-3: checkDuplicate — 중복 없음 → conflicts=[]', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.checkDuplicate({
                students: [{ societyName: '신규A' }, { societyName: '신규B', catholicName: '요한' }],
            });
            expect(result.conflicts).toEqual([]);
        });
    });

    describe('충돌 케이스', () => {
        it('TC-4: 단건 충돌 → 409 CONFLICT', async () => {
            await insertStudent('박민수', '베드로');
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(
                caller.student.create({
                    societyName: '박민수',
                    catholicName: '베드로',
                    groupIds: [groupId],
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('TC-5: 단건 강제 등록 → 200 (force=true)', async () => {
            await insertStudent('박민수', '베드로');
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.create({
                societyName: '박민수',
                catholicName: '베드로',
                groupIds: [groupId],
                force: true,
            });
            expect(result.societyName).toBe('박민수');
            const count = await database.student.count({
                where: { societyName: '박민수', organizationId: seed.org.id, deletedAt: null },
            });
            expect(count).toBe(2);
        });

        it('TC-6: 일괄 입력 내부 동일 키 2행 (force=false) → 둘 다 INTERNAL_DUP', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCreate({
                students: [
                    { societyName: '김지훈', catholicName: '요셉', groupIds: [groupId] },
                    { societyName: '김지훈', catholicName: '요셉', groupIds: [groupId] },
                ],
            });
            expect(result.successCount).toBe(0);
            expect(result.totalCount).toBe(2);
            expect(result.skipped).toHaveLength(2);
            expect(result.skipped.every((s) => s.reason === 'INTERNAL_DUP')).toBe(true);
        });

        it('TC-7: 일괄 DB 중복 1행 (force=false) → 해당 행만 DB_DUP', async () => {
            await insertStudent('박민수', '베드로');
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCreate({
                students: [
                    { societyName: '박민수', catholicName: '베드로', groupIds: [groupId] }, // DB 중복
                    { societyName: '신규학생', groupIds: [groupId] },
                ],
            });
            expect(result.successCount).toBe(1);
            expect(result.totalCount).toBe(2);
            expect(result.skipped).toHaveLength(1);
            expect(result.skipped[0]).toMatchObject({ index: 0, reason: 'DB_DUP' });
        });

        it('TC-8: 일괄 행별 force=true 토글 → 강제 행만 등록', async () => {
            await insertStudent('박민수', '베드로');
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCreate({
                students: [
                    { societyName: '박민수', catholicName: '베드로', groupIds: [groupId], force: true }, // 강제
                    { societyName: '박민수', catholicName: '베드로', groupIds: [groupId], force: false }, // 제외 (force=false 명시)
                ],
            });
            // force=true 행은 등록, force=false 행은 INTERNAL_DUP으로 skipped
            // (또 다른 force=true 행이 같은 그룹 멤버이지만 force=false 행 입장에서는 internal dup)
            expect(result.successCount).toBe(1);
            expect(result.skipped).toHaveLength(1);
            expect(result.skipped[0].reason).toBe('INTERNAL_DUP');
        });
    });

    describe('정책 경계', () => {
        it('TC-9: 세례명 한쪽 NULL → 충돌 아님', async () => {
            await insertStudent('박민수', null);
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.create({
                societyName: '박민수',
                catholicName: '베드로',
                groupIds: [groupId],
            });
            expect(result.societyName).toBe('박민수');
        });

        it('TC-10: 삭제된 학생과 동일 키 → 충돌 아님 (deletedAt 제외)', async () => {
            await insertStudent('박민수', '베드로', { deletedAt: getNowKST() });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.create({
                societyName: '박민수',
                catholicName: '베드로',
                groupIds: [groupId],
            });
            expect(result.societyName).toBe('박민수');
        });

        it('TC-11: 졸업 학생과 동일 키 → 충돌 (졸업 포함)', async () => {
            await insertStudent('박민수', '베드로', { graduatedAt: getNowKST() });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(
                caller.student.create({
                    societyName: '박민수',
                    catholicName: '베드로',
                    groupIds: [groupId],
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('TC-12: 공백 정규화 — 다중 공백만 다르면 충돌', async () => {
            await insertStudent('박  민수', '베드로');
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(
                caller.student.create({
                    societyName: '박 민수',
                    catholicName: '베드로',
                    groupIds: [groupId],
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });
});
