/**
 * Bulk Delete Students UseCase
 *
 * 학생 일괄 삭제 (소프트 삭제)
 */
import type { BulkDeleteStudentsInput, BulkDeleteStudentsOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class BulkDeleteStudentsUseCase {
    async execute(input: BulkDeleteStudentsInput, accountId: string): Promise<BulkDeleteStudentsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));

            // 해당 계정 소유 그룹의 학생만 삭제
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
                    deletedAt: null,
                },
                data: {
                    deletedAt: getNowKST(),
                },
            });

            return {
                deletedCount: result.count,
            };
        } catch (e) {
            console.error('[BulkDeleteStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 일괄 삭제에 실패했습니다.',
            });
        }
    }
}
