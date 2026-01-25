/**
 * Delete Student UseCase
 *
 * 학생 삭제 (소프트 삭제)
 */
import type { DeleteStudentInput, DeleteStudentOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class DeleteStudentUseCase {
    async execute(input: DeleteStudentInput): Promise<DeleteStudentOutput> {
        try {
            const student = await database.student.update({
                where: {
                    id: BigInt(input.id),
                },
                data: {
                    deletedAt: getNowKST(),
                },
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact != null ? Number(student.contact) : undefined,
                description: student.description ?? undefined,
                groupId: String(student.groupId),
                baptizedAt: student.baptizedAt ?? undefined,
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
