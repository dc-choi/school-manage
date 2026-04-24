/**
 * Agree Privacy UseCase
 *
 * 개인정보 수집·이용 동의 기록 (멱등)
 */
import { CURRENT_PRIVACY_VERSION } from '@school/shared';
import type { AgreePrivacyOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class AgreePrivacyUseCase {
    async execute(accountId: string): Promise<AgreePrivacyOutput> {
        const account = await database.account.findFirst({
            where: { id: BigInt(accountId), deletedAt: null },
            select: { id: true, privacyAgreedAt: true, privacyPolicyVersion: true },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 이미 최신 버전에 동의한 경우 기존 값 반환 (멱등)
        if (account.privacyAgreedAt && account.privacyPolicyVersion >= CURRENT_PRIVACY_VERSION) {
            return {
                privacyAgreedAt: account.privacyAgreedAt,
                privacyPolicyVersion: account.privacyPolicyVersion,
            };
        }

        // 동의 기록 (신규 또는 재동의 — 버전 업그레이드)
        const updated = await database.account.update({
            where: { id: BigInt(accountId) },
            data: {
                privacyAgreedAt: getNowKST(),
                privacyPolicyVersion: CURRENT_PRIVACY_VERSION,
            },
            select: { privacyAgreedAt: true, privacyPolicyVersion: true },
        });

        return {
            privacyAgreedAt: updated.privacyAgreedAt!,
            privacyPolicyVersion: updated.privacyPolicyVersion,
        };
    }
}
