/**
 * Bulk Delete Groups UseCase
 *
 * 그룹 일괄 삭제 (소프트 삭제)
 */
import type { BulkDeleteGroupsInput, BulkDeleteGroupsOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class BulkDeleteGroupsUseCase {
    async execute(input: BulkDeleteGroupsInput, accountId: string): Promise<BulkDeleteGroupsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));

            // 해당 계정 소유이면서 삭제되지 않은 그룹만 삭제
            const result = await database.group.updateMany({
                where: {
                    id: { in: ids },
                    accountId: BigInt(accountId),
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
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
