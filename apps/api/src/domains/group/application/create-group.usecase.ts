/**
 * Create Group UseCase
 *
 * 새 그룹 생성
 */
import type { CreateGroupOutput, CreateGroupInput as CreateGroupSchemaInput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createGroupSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type CreateGroupInput = CreateGroupSchemaInput & { accountId: string; organizationId: string };

export class CreateGroupUseCase {
    async execute(input: CreateGroupInput): Promise<CreateGroupOutput> {
        try {
            // 측정 인프라: 조직의 첫 그룹인지 확인 (생성 전)
            const existingGroupCount = await database.group.count({
                where: {
                    organizationId: BigInt(input.organizationId),
                    deletedAt: null,
                },
            });
            const isFirstGroup = existingGroupCount === 0;

            // 측정 인프라: 조직 생성 후 경과일 계산
            let daysSinceSignup: number | undefined;
            if (isFirstGroup) {
                const organization = await database.organization.findUnique({
                    where: { id: BigInt(input.organizationId) },
                    select: { createdAt: true },
                });
                if (organization?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - organization.createdAt.getTime();
                    daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            const group = await database.$transaction(async (tx) => {
                const created = await tx.group.create({
                    data: {
                        name: input.name,
                        type: input.type,
                        accountId: BigInt(input.accountId),
                        organizationId: BigInt(input.organizationId),
                        createdAt: getNowKST(),
                    },
                });
                await createGroupSnapshot(tx, {
                    groupId: created.id,
                    name: created.name,
                });
                return created;
            });

            return {
                id: String(group.id),
                name: group.name,
                type: group.type,
                organizationId: String(group.organizationId),
                studentCount: 0,
                isFirstGroup,
                daysSinceSignup,
            };
        } catch (e) {
            console.error('[CreateGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학년 생성에 실패했습니다.',
            });
        }
    }
}
