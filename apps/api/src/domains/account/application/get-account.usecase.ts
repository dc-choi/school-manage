/**
 * Get Account UseCase
 *
 * 인증된 사용자의 계정 정보 반환 (DB 조회)
 */
import type { AccountInfo, GetAccountOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class GetAccountUseCase {
    async execute(account: AccountInfo): Promise<GetAccountOutput> {
        const found = await database.account.findFirst({
            where: { id: BigInt(account.id), deletedAt: null },
            select: { id: true, name: true, displayName: true, privacyAgreedAt: true },
        });

        if (!found) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        const { id, name, displayName, privacyAgreedAt } = found;

        return {
            id: String(id),
            name,
            displayName,
            privacyAgreedAt,
        };
    }
}
