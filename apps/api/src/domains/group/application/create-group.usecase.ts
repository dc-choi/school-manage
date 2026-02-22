/**
 * Create Group UseCase
 *
 * 새 그룹 생성
 */
import type { CreateGroupOutput, CreateGroupInput as CreateGroupSchemaInput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type CreateGroupInput = CreateGroupSchemaInput & { accountId: string };

export class CreateGroupUseCase {
    async execute(input: CreateGroupInput): Promise<CreateGroupOutput> {
        try {
            // 측정 인프라: 계정의 첫 그룹인지 확인 (생성 전)
            const existingGroupCount = await database.group.count({
                where: {
                    accountId: BigInt(input.accountId),
                    deletedAt: null,
                },
            });
            const isFirstGroup = existingGroupCount === 0;

            // 측정 인프라: 가입 후 경과일 계산
            let daysSinceSignup: number | undefined;
            if (isFirstGroup) {
                const account = await database.account.findUnique({
                    where: { id: BigInt(input.accountId) },
                    select: { createdAt: true },
                });
                if (account?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - account.createdAt.getTime();
                    daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            const group = await database.group.create({
                data: {
                    name: input.name,
                    accountId: BigInt(input.accountId),
                    createdAt: getNowKST(),
                },
            });

            return {
                id: String(group.id),
                name: group.name,
                accountId: String(group.accountId),
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
