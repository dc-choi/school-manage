/**
 * Bulk Delete Groups UseCase
 *
 * 그룹 일괄 삭제 (소프트 삭제)
 */
import type { BulkDeleteGroupsInput, BulkDeleteGroupsOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class BulkDeleteGroupsUseCase {
    async execute(input: BulkDeleteGroupsInput, organizationId: string): Promise<BulkDeleteGroupsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));

            // 해당 조직 소유이면서 삭제되지 않은 그룹만 삭제
            const result = await database.group.updateMany({
                where: {
                    id: { in: ids },
                    organizationId: BigInt(organizationId),
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
            console.error('[BulkDeleteGroupsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학년 일괄 삭제에 실패했습니다.',
            });
        }
    }
}
