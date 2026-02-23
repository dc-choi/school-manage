/**
 * Snapshot 통합 테스트
 *
 * 스냅샷 헬퍼 함수의 동작을 검증합니다.
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockGroupSnapshot, createMockStudentSnapshot } from '../helpers/mock-data.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBulkGroupSnapshots, getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';

describe('snapshot 헬퍼 함수 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.studentSnapshot.findMany.mockReset();
        mockPrismaClient.groupSnapshot.findMany.mockReset();
    });

    describe('getBulkStudentSnapshots', () => {
        it('studentId별 가장 최근 스냅샷 반환', async () => {
            const referenceDate = new Date(2024, 11, 31);
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                // studentId=1 최근 스냅샷 (먼저 반환됨 — orderBy desc)
                createMockStudentSnapshot({
                    studentId: BigInt(1),
                    societyName: '홍길동(변경후)',
                    snapshotAt: new Date(2024, 6, 1),
                }),
                // studentId=1 이전 스냅샷
                createMockStudentSnapshot({
                    studentId: BigInt(1),
                    societyName: '홍길동(변경전)',
                    snapshotAt: new Date(2024, 0, 1),
                }),
                // studentId=2
                createMockStudentSnapshot({
                    studentId: BigInt(2),
                    societyName: '김철수',
                    snapshotAt: new Date(2024, 3, 1),
                }),
            ]);

            const result = await getBulkStudentSnapshots([BigInt(1), BigInt(2)], referenceDate);

            expect(result.size).toBe(2);
            expect(result.get(BigInt(1))?.societyName).toBe('홍길동(변경후)');
            expect(result.get(BigInt(2))?.societyName).toBe('김철수');
        });

        it('빈 배열 입력 시 빈 Map 반환', async () => {
            const result = await getBulkStudentSnapshots([], new Date());

            expect(result.size).toBe(0);
            expect(mockPrismaClient.studentSnapshot.findMany).not.toHaveBeenCalled();
        });

        it('스냅샷이 없는 studentId는 Map에 포함되지 않음', async () => {
            mockPrismaClient.studentSnapshot.findMany.mockResolvedValueOnce([
                createMockStudentSnapshot({ studentId: BigInt(1), societyName: '홍길동' }),
            ]);

            const result = await getBulkStudentSnapshots([BigInt(1), BigInt(999)], new Date());

            expect(result.size).toBe(1);
            expect(result.has(BigInt(1))).toBe(true);
            expect(result.has(BigInt(999))).toBe(false);
        });
    });

    describe('getBulkGroupSnapshots', () => {
        it('groupId별 가장 최근 스냅샷 반환', async () => {
            const referenceDate = new Date(2024, 11, 31);
            mockPrismaClient.groupSnapshot.findMany.mockResolvedValueOnce([
                createMockGroupSnapshot({
                    groupId: BigInt(10),
                    name: '1학년(변경후)',
                    snapshotAt: new Date(2024, 6, 1),
                }),
                createMockGroupSnapshot({
                    groupId: BigInt(10),
                    name: '1학년(변경전)',
                    snapshotAt: new Date(2024, 0, 1),
                }),
                createMockGroupSnapshot({
                    groupId: BigInt(20),
                    name: '2학년',
                    snapshotAt: new Date(2024, 3, 1),
                }),
            ]);

            const result = await getBulkGroupSnapshots([BigInt(10), BigInt(20)], referenceDate);

            expect(result.size).toBe(2);
            expect(result.get(BigInt(10))?.name).toBe('1학년(변경후)');
            expect(result.get(BigInt(20))?.name).toBe('2학년');
        });

        it('빈 배열 입력 시 빈 Map 반환', async () => {
            const result = await getBulkGroupSnapshots([], new Date());

            expect(result.size).toBe(0);
            expect(mockPrismaClient.groupSnapshot.findMany).not.toHaveBeenCalled();
        });

        it('스냅샷이 없는 groupId는 Map에 포함되지 않음', async () => {
            mockPrismaClient.groupSnapshot.findMany.mockResolvedValueOnce([
                createMockGroupSnapshot({ groupId: BigInt(10), name: '1학년' }),
            ]);

            const result = await getBulkGroupSnapshots([BigInt(10), BigInt(999)], new Date());

            expect(result.size).toBe(1);
            expect(result.has(BigInt(10))).toBe(true);
            expect(result.has(BigInt(999))).toBe(false);
        });
    });
});
