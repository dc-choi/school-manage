/**
 * Bulk Remove Students from Group UseCase
 *
 * 그룹에서 학생 일괄 제거
 */
import type { BulkRemoveStudentsFromGroupInput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

type BulkRemoveStudentsFromGroupUseCaseInput = BulkRemoveStudentsFromGroupInput & { organizationId: string };

export class BulkRemoveStudentsFromGroupUseCase {
    async execute(input: BulkRemoveStudentsFromGroupUseCaseInput): Promise<{ removedCount: number }> {
        const { groupId, studentIds, organizationId } = input;
        const orgId = BigInt(organizationId);

        try {
            // 그룹 소유권 검증
            const group = await database.group.findFirst({
                where: { id: BigInt(groupId), organizationId: orgId, deletedAt: null },
                select: { id: true },
            });
            if (!group) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다.' });
            }

            // 학생들 소유권 검증
            const bigintIds = studentIds.map((id: string) => BigInt(id));
            const students = await database.student.findMany({
                where: { id: { in: bigintIds }, organizationId: orgId, deletedAt: null },
                select: { id: true },
            });
            if (students.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '유효한 학생이 없습니다.' });
            }

            // StudentGroup 일괄 삭제
            const result = await database.studentGroup.deleteMany({
                where: {
                    groupId: group.id,
                    studentId: { in: students.map((s) => s.id) },
                },
            });

            return { removedCount: result.count };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkRemoveStudentsFromGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '그룹에서 학생을 일괄 제거하는 데 실패했습니다.',
            });
        }
    }
}
