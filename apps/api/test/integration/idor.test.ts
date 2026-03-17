/**
 * IDOR (Insecure Direct Object Reference) 회귀 테스트
 *
 * 모든 scopedProcedure 엔드포인트에서 organizationId가
 * DB 쿼리 where절에 포함되는지 검증한다.
 *
 * 타 조직 리소스 접근 시 NOT_FOUND 또는 FORBIDDEN을 반환해야 한다.
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 조직 A: organizationId = '1'
const createOrgACaller = () => createScopedCaller('1', '계정A', '1', '조직A');

// 조직 B: organizationId = '999' (타 조직)
const createOrgBCaller = () => createScopedCaller('2', '계정B', '999', '조직B');

describe('IDOR 회귀 테스트', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        // 기본: 모든 쿼리가 null/빈 배열을 반환 (타 조직 리소스 없음)
        mockPrismaClient.student.findFirst.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.group.findFirst.mockReset();
        mockPrismaClient.group.findMany.mockReset();
        mockPrismaClient.group.count.mockReset();
        mockPrismaClient.attendance.findMany.mockReset();
    });

    describe('학생 도메인', () => {
        it('student.get — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.student.get({ id: '1' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.student.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.delete — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.student.delete({ id: '1' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.student.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.update — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.student.update({ id: '1', societyName: '테스트' })).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });

            expect(mockPrismaClient.student.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.create — groupIds 소유권 검증 (assertGroupIdsOwnership)', async () => {
            // group.count가 0을 반환 → 타 조직 그룹
            mockPrismaClient.student.count.mockResolvedValueOnce(0);
            mockPrismaClient.group.count.mockResolvedValueOnce(0);
            const caller = createOrgBCaller();

            await expect(
                caller.student.create({
                    societyName: '테스트',
                    groupIds: ['1'],
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });

            expect(mockPrismaClient.group.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.bulkCreate — groupIds 소유권 검증 (assertGroupIdsOwnership)', async () => {
            mockPrismaClient.group.count.mockResolvedValueOnce(0);
            const caller = createOrgBCaller();

            await expect(
                caller.student.bulkCreate({
                    students: [{ societyName: '테스트', groupIds: ['1'] }],
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });

            expect(mockPrismaClient.group.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.list — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findMany.mockResolvedValueOnce([]);
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            mockPrismaClient.student.count.mockResolvedValueOnce(0);
            const caller = createOrgBCaller();

            await caller.student.list({});

            expect(mockPrismaClient.student.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('student.bulkDelete — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.student.bulkDelete({ ids: ['1'] });

            expect(mockPrismaClient.student.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });
    });

    describe('그룹 도메인', () => {
        it('group.list — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findMany.mockResolvedValueOnce([]);
            const caller = createOrgBCaller();

            await caller.group.list({});

            expect(mockPrismaClient.group.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('group.get — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.get({ id: '1' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });

        it('group.bulkDelete — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.group.bulkDelete({ ids: ['1'] });

            expect(mockPrismaClient.group.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });
    });

    describe('출석 도메인', () => {
        it('attendance.calendar — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.attendance.calendar({ groupId: '1', year: 2026, month: 1 })).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: BigInt(999),
                    }),
                })
            );
        });
    });

    describe('소유권 검증 유틸리티', () => {
        it('assertGroupIdsOwnership — count 불일치 시 FORBIDDEN', async () => {
            // 2개 요청, 1개만 유효 → FORBIDDEN
            mockPrismaClient.group.count.mockResolvedValueOnce(1);

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership(['1', '2'], '999')).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('assertGroupIdsOwnership — count 일치 시 통과', async () => {
            mockPrismaClient.group.count.mockResolvedValueOnce(2);

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership(['1', '2'], '1')).resolves.toBeUndefined();
        });

        it('assertStudentIdsOwnership — count 불일치 시 FORBIDDEN', async () => {
            mockPrismaClient.student.count.mockResolvedValueOnce(0);

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertStudentIdsOwnership(['1'], '999')).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('assertStudentIdsOwnership — count 일치 시 통과', async () => {
            mockPrismaClient.student.count.mockResolvedValueOnce(3);

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertStudentIdsOwnership(['1', '2', '3'], '1')).resolves.toBeUndefined();
        });
    });
});
