/**
 * Update Profile UseCase
 *
 * 프로필 수정 비즈니스 로직
 * displayName 업데이트
 */
import type { UpdateProfileInput, UpdateProfileOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class UpdateProfileUseCase {
    async execute(input: UpdateProfileInput, accountId: string): Promise<UpdateProfileOutput> {
        const account = await database.account.findFirst({
            where: { id: BigInt(accountId), deletedAt: null },
            select: { id: true },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        const updated = await database.account.update({
            where: { id: account.id },
            data: {
                displayName: input.displayName,
                updatedAt: getNowKST(),
            },
            select: { displayName: true },
        });

        return { displayName: updated.displayName };
    }
}
