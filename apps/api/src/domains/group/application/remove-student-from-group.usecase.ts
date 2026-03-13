/**
 * Remove Student from Group UseCase
 *
 * 그룹에서 학생 제거
 */
import type { RemoveStudentFromGroupInput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

type RemoveStudentFromGroupUseCaseInput = RemoveStudentFromGroupInput & { organizationId: string };

export class RemoveStudentFromGroupUseCase {
    async execute(input: RemoveStudentFromGroupUseCaseInput): Promise<{ success: boolean }> {
        const { groupId, studentId, organizationId } = input;
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

            // 학생 소유권 검증
            const student = await database.student.findFirst({
                where: { id: BigInt(studentId), organizationId: orgId, deletedAt: null },
                select: { id: true },
            });
            if (!student) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' });
            }

            // StudentGroup 삭제
            await database.studentGroup.deleteMany({
                where: { studentId: student.id, groupId: group.id },
            });

            return { success: true };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[RemoveStudentFromGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '그룹에서 학생을 제거하는 데 실패했습니다.',
            });
        }
    }
}
