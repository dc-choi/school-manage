/**
 * Update Group UseCase
 *
 * 그룹 정보 수정
 */
import type { GroupOutput, UpdateGroupInput as UpdateGroupSchemaInput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createGroupSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type UpdateGroupInput = UpdateGroupSchemaInput & { accountId: string; organizationId: string };

export class UpdateGroupUseCase {
    async execute(input: UpdateGroupInput): Promise<GroupOutput> {
        try {
            const group = await database.$transaction(async (tx) => {
                // 소유권 검증: 해당 조직의 그룹인지 확인
                const existing = await tx.group.findFirst({
                    where: { id: BigInt(input.id), organizationId: BigInt(input.organizationId), deletedAt: null },
                });
                if (!existing) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: '해당 학년에 대한 접근 권한이 없습니다.' });
                }

                const updated = await tx.group.update({
                    where: {
                        id: BigInt(input.id),
                    },
                    data: {
                        name: input.name,
                        type: input.type,
                        organizationId: BigInt(input.organizationId),
                        updatedAt: getNowKST(),
                    },
                    include: {
                        _count: {
                            select: {
                                studentGroups: {
                                    where: {
                                        student: { deletedAt: null },
                                    },
                                },
                            },
                        },
                    },
                });
                await createGroupSnapshot(tx, {
                    groupId: updated.id,
                    name: updated.name,
                });
                return updated;
            });

            return {
                id: String(group.id),
                name: group.name,
                type: group.type,
                organizationId: String(group.organizationId),
                studentCount: group._count.studentGroups,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[UpdateGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학년 수정에 실패했습니다.',
            });
        }
    }
}
