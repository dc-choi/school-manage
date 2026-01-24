/**
 * Delete Group UseCase
 *
 * 그룹 삭제 (소프트 삭제)
 */
import type { DeleteGroupInput, GroupOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { getNowKST } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

export class DeleteGroupUseCase {
    async execute(input: DeleteGroupInput): Promise<GroupOutput> {
        try {
            const group = await database.group.update({
                where: {
                    id: BigInt(input.id),
                },
                data: {
                    deletedAt: getNowKST(),
                },
            });

            return {
                id: String(group.id),
                name: group.name,
                accountId: String(group.accountId),
                studentCount: 0,
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
