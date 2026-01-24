/**
 * Create Group UseCase
 *
 * 새 그룹 생성
 */
import type { CreateGroupInput as CreateGroupSchemaInput, GroupOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { getNowKST } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type CreateGroupInput = CreateGroupSchemaInput & { accountId: string };

export class CreateGroupUseCase {
    async execute(input: CreateGroupInput): Promise<GroupOutput> {
        try {
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
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
