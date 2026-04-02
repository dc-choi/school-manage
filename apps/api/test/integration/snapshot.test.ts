/**
 * Snapshot 통합 테스트 (실제 DB)
 *
 * 스냅샷 헬퍼 함수의 동작을 검증합니다.
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { getBulkGroupSnapshots, getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('snapshot 헬퍼 함수 테스트', () => {
    describe('getBulkStudentSnapshots', () => {
        it('studentId별 가장 최근 스냅샷 반환', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const s1 = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '김철수', organizationId: seed.org.id, createdAt: now },
            });

            // s1: 두 개의 스냅샷 (최근 것이 선택되어야 함)
            await database.studentSnapshot.create({
                data: {
                    studentId: s1.id,
                    societyName: '홍길동(변경전)',
                    groupId: group.id,
                    snapshotAt: new Date(2024, 0, 1),
                },
            });
            await database.studentSnapshot.create({
                data: {
                    studentId: s1.id,
                    societyName: '홍길동(변경후)',
                    groupId: group.id,
                    snapshotAt: new Date(2024, 6, 1),
                },
            });
            // s2: 스냅샷 1개
            await database.studentSnapshot.create({
                data: {
                    studentId: s2.id,
                    societyName: '김철수',
                    groupId: group.id,
                    snapshotAt: new Date(2024, 3, 1),
                },
            });

            const referenceDate = new Date(2024, 11, 31);
            const result = await getBulkStudentSnapshots([s1.id, s2.id], referenceDate);

            expect(result.size).toBe(2);
            expect(result.get(s1.id)?.societyName).toBe('홍길동(변경후)');
            expect(result.get(s2.id)?.societyName).toBe('김철수');
        });

        it('빈 배열 입력 시 빈 Map 반환', async () => {
            const result = await getBulkStudentSnapshots([], new Date());
            expect(result.size).toBe(0);
        });

        it('스냅샷이 없는 studentId는 Map에 포함되지 않음', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const s1 = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });

            await database.studentSnapshot.create({
                data: {
                    studentId: s1.id,
                    societyName: '홍길동',
                    groupId: group.id,
                    snapshotAt: now,
                },
            });

            const result = await getBulkStudentSnapshots([s1.id, BigInt(999)], getNowKST());
            expect(result.size).toBe(1);
            expect(result.has(s1.id)).toBe(true);
            expect(result.has(BigInt(999))).toBe(false);
        });
    });

    describe('getBulkGroupSnapshots', () => {
        it('groupId별 가장 최근 스냅샷 반환', async () => {
            const now = getNowKST();
            const g1 = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const g2 = await database.group.create({
                data: { name: '2학년', organizationId: seed.org.id, createdAt: now },
            });

            // g1: 두 개의 스냅샷
            await database.groupSnapshot.create({
                data: { groupId: g1.id, name: '1학년(변경전)', snapshotAt: new Date(2024, 0, 1) },
            });
            await database.groupSnapshot.create({
                data: { groupId: g1.id, name: '1학년(변경후)', snapshotAt: new Date(2024, 6, 1) },
            });
            await database.groupSnapshot.create({
                data: { groupId: g2.id, name: '2학년', snapshotAt: new Date(2024, 3, 1) },
            });

            const referenceDate = new Date(2024, 11, 31);
            const result = await getBulkGroupSnapshots([g1.id, g2.id], referenceDate);

            expect(result.size).toBe(2);
            expect(result.get(g1.id)?.name).toBe('1학년(변경후)');
            expect(result.get(g2.id)?.name).toBe('2학년');
        });

        it('빈 배열 입력 시 빈 Map 반환', async () => {
            const result = await getBulkGroupSnapshots([], new Date());
            expect(result.size).toBe(0);
        });

        it('스냅샷이 없는 groupId는 Map에 포함되지 않음', async () => {
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: getNowKST() },
            });
            await database.groupSnapshot.create({
                data: { groupId: group.id, name: '1학년', snapshotAt: getNowKST() },
            });

            const result = await getBulkGroupSnapshots([group.id, BigInt(999)], getNowKST());
            expect(result.size).toBe(1);
            expect(result.has(group.id)).toBe(true);
            expect(result.has(BigInt(999))).toBe(false);
        });
    });
});
