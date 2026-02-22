/**
 * Agree Privacy UseCase
 *
 * 개인정보 수집·이용 동의 기록 (멱등)
 */
import type { AgreePrivacyOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class AgreePrivacyUseCase {
    async execute(accountId: string): Promise<AgreePrivacyOutput> {
        const account = await database.account.findFirst({
            where: { id: BigInt(accountId), deletedAt: null },
            select: { id: true, privacyAgreedAt: true },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 이미 동의한 경우 기존 값 반환 (멱등)
        if (account.privacyAgreedAt) {
            return { privacyAgreedAt: account.privacyAgreedAt };
        }

        // 동의 기록
        const updated = await database.account.update({
            where: { id: BigInt(accountId) },
            data: { privacyAgreedAt: getNowKST() },
            select: { privacyAgreedAt: true },
        });

        return { privacyAgreedAt: updated.privacyAgreedAt! };
    }
}
