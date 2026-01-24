/**
 * Restore Students UseCase
 *
 * 삭제된 학생 복구
 */
import type { RestoreStudentsInput, RestoreStudentsOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class RestoreStudentsUseCase {
    async execute(input: RestoreStudentsInput, accountId: string): Promise<RestoreStudentsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));

            // 해당 계정 소유 그룹의 학생만 복구
            const groups = await database.group.findMany({
                where: {
                    accountId: BigInt(accountId),
                    deletedAt: null,
                },
                select: { id: true },
            });
            const groupIds = groups.map((g) => g.id);

            const result = await database.student.updateMany({
                where: {
                    id: { in: ids },
                    groupId: { in: groupIds },
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
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
