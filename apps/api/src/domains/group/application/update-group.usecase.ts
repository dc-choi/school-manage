/**
 * Update Group UseCase
 *
 * 그룹 정보 수정
 */
import type { GroupOutput, UpdateGroupInput as UpdateGroupSchemaInput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type UpdateGroupInput = UpdateGroupSchemaInput & { accountId: string };

export class UpdateGroupUseCase {
    async execute(input: UpdateGroupInput): Promise<GroupOutput> {
        try {
            const group = await database.group.update({
                where: {
                    id: BigInt(input.id),
                },
                data: {
                    name: input.name,
                    accountId: BigInt(input.accountId),
                    updatedAt: getNowKST(),
                },
                include: {
                    _count: {
                        select: {
                            students: {
                                where: {
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
            });

            return {
                id: String(group.id),
                name: group.name,
                accountId: String(group.accountId),
                studentCount: group._count.students,
            };
        } catch (e) {
            console.error('[UpdateGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학년 수정에 실패했습니다.',
            });
        }
    }
}
