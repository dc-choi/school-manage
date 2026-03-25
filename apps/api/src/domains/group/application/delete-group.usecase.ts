/**
 * Delete Group UseCase
 *
 * 그룹 삭제 (소프트 삭제)
 */
import type { DeleteGroupInput, GroupOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type DeleteGroupUseCaseInput = DeleteGroupInput & { organizationId: string };

export class DeleteGroupUseCase {
    async execute(input: DeleteGroupUseCaseInput): Promise<GroupOutput> {
        try {
            const group = await database.group.update({
                where: {
                    id: BigInt(input.id),
                    organizationId: BigInt(input.organizationId),
                },
                data: {
                    deletedAt: getNowKST(),
                },
            });

            return {
                id: String(group.id),
                name: group.name,
                type: group.type,
                organizationId: String(group.organizationId),
                studentCount: 0,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[DeleteGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학년 삭제에 실패했습니다.',
            });
        }
    }
}
