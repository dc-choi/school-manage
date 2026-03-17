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

// 조직 B: organizationId = '999' (타 조직)
const createOrgBCaller = () => createScopedCaller('2', '계정B', '999', '조직B');

const ORG_B_ID = BigInt(999);

describe('IDOR 회귀 테스트', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockPrismaClient.student.findFirst.mockReset();
        mockPrismaClient.student.findMany.mockReset();
        mockPrismaClient.student.count.mockReset();
        mockPrismaClient.student.updateMany.mockReset();
        mockPrismaClient.group.findFirst.mockReset();
        mockPrismaClient.group.findMany.mockReset();
        mockPrismaClient.group.count.mockReset();
        mockPrismaClient.group.update.mockReset();
        mockPrismaClient.group.updateMany.mockReset();
        mockPrismaClient.attendance.findMany.mockReset();
        mockPrismaClient.registration.updateMany.mockReset();
        mockPrismaClient.organization.findUnique.mockReset();
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.update — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.student.update({ id: '1', societyName: '테스트' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.student.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.create — groupIds 소유권 검증 (assertGroupIdsOwnership)', async () => {
            mockPrismaClient.student.count.mockResolvedValueOnce(0);
            mockPrismaClient.group.count.mockResolvedValueOnce(0);
            const caller = createOrgBCaller();

            await expect(
                caller.student.create({ societyName: '테스트', groupIds: ['1'] })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });

            expect(mockPrismaClient.group.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.bulkCreate — groupIds 소유권 검증 (assertGroupIdsOwnership)', async () => {
            mockPrismaClient.group.count.mockResolvedValueOnce(0);
            const caller = createOrgBCaller();

            await expect(
                caller.student.bulkCreate({ students: [{ societyName: '테스트', groupIds: ['1'] }] })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });

            expect(mockPrismaClient.group.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.bulkDelete — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.student.bulkDelete({ ids: ['1'] });

            expect(mockPrismaClient.student.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.restore — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.student.restore({ ids: ['1'] });

            expect(mockPrismaClient.student.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.feastDayList — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            const caller = createOrgBCaller();

            await caller.student.feastDayList({ month: 1 });

            expect(mockPrismaClient.student.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.graduate — where절에 organizationId 포함', async () => {
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockPrismaClient));
            mockPrismaClient.organization.findUnique.mockResolvedValueOnce({ type: 'MIDDLE_HIGH' });
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            const caller = createOrgBCaller();

            await caller.student.graduate({ ids: ['1'] });

            expect(mockPrismaClient.student.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.cancelGraduation — where절에 organizationId 포함', async () => {
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockPrismaClient));
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            const caller = createOrgBCaller();

            await caller.student.cancelGraduation({ ids: ['1'] });

            expect(mockPrismaClient.student.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.bulkRegister — where절에 organizationId 포함', async () => {
            mockPrismaClient.student.findMany.mockResolvedValueOnce([]);
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockPrismaClient));
            const caller = createOrgBCaller();

            await caller.student.bulkRegister({ ids: ['1'] });

            expect(mockPrismaClient.student.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('student.bulkCancelRegistration — where절에 student.organizationId 포함', async () => {
            mockPrismaClient.registration.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.student.bulkCancelRegistration({ ids: ['1'] });

            expect(mockPrismaClient.registration.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        student: { organizationId: ORG_B_ID },
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.update — where절에 organizationId 포함', async () => {
            mockPrismaClient.$transaction = vi.fn().mockImplementation(async (cb) => cb(mockPrismaClient));
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.update({ id: '1', name: '테스트', type: 'GRADE' })).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.delete — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.update.mockResolvedValueOnce({ id: BigInt(1), name: '테스트', type: 'GRADE', organizationId: ORG_B_ID });
            const caller = createOrgBCaller();

            await caller.group.delete({ id: '1' });

            expect(mockPrismaClient.group.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.bulkDelete — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.updateMany.mockResolvedValueOnce({ count: 0 });
            const caller = createOrgBCaller();

            await caller.group.bulkDelete({ ids: ['1'] });

            expect(mockPrismaClient.group.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.addStudent — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.addStudent({ groupId: '1', studentId: '1' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.removeStudent — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.removeStudent({ groupId: '1', studentId: '1' })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.bulkAddStudents — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.bulkAddStudents({ groupId: '1', studentIds: ['1'] })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });

        it('group.bulkRemoveStudents — where절에 organizationId 포함', async () => {
            mockPrismaClient.group.findFirst.mockResolvedValueOnce(null);
            const caller = createOrgBCaller();

            await expect(caller.group.bulkRemoveStudents({ groupId: '1', studentIds: ['1'] })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            expect(mockPrismaClient.group.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
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
                    where: expect.objectContaining({ organizationId: ORG_B_ID }),
                })
            );
        });
    });

    describe('소유권 검증 유틸리티', () => {
        it('assertGroupIdsOwnership — count 불일치 시 FORBIDDEN', async () => {
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

        it('assertGroupIdsOwnership — 중복 ID 제거 후 검증', async () => {
            mockPrismaClient.group.count.mockResolvedValueOnce(1);

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            // ['1', '1', '1'] → 중복 제거 → ['1'] → count 1 = 통과
            await expect(assertGroupIdsOwnership(['1', '1', '1'], '1')).resolves.toBeUndefined();
        });

        it('assertGroupIdsOwnership — 빈 배열 시 즉시 통과', async () => {
            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership([], '1')).resolves.toBeUndefined();
            expect(mockPrismaClient.group.count).not.toHaveBeenCalled();
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

        it('assertStudentIdsOwnership — 중복 ID 제거 후 검증', async () => {
            mockPrismaClient.student.count.mockResolvedValueOnce(2);

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            // ['1', '2', '1'] → 중복 제거 → ['1', '2'] → count 2 = 통과
            await expect(assertStudentIdsOwnership(['1', '2', '1'], '1')).resolves.toBeUndefined();
        });

        it('assertStudentIdsOwnership — 빈 배열 시 즉시 통과', async () => {
            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertStudentIdsOwnership([], '1')).resolves.toBeUndefined();
            expect(mockPrismaClient.student.count).not.toHaveBeenCalled();
        });
    });
});
