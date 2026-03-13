/**
 * Restore Students UseCase
 *
 * 삭제된 학생 복구
 */
import type { RestoreStudentsInput, RestoreStudentsOutput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class RestoreStudentsUseCase {
    async execute(input: RestoreStudentsInput, organizationId: string): Promise<RestoreStudentsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));

            const result = await database.student.updateMany({
                where: {
                    id: { in: ids },
                    organizationId: BigInt(organizationId),
                    deletedAt: { not: null },
                },
                data: {
                    deletedAt: null,
                },
            });

            return {
                restoredCount: result.count,
            };
        } catch (e) {
            console.error('[RestoreStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 복원에 실패했습니다.',
            });
        }
    }
}
