/**
 * Count Accounts UseCase
 *
 * 전체 가입 계정 수 + 성당 수 조회 (랜딩 집계용 — 소프트 삭제 포함)
 */
import type { GetAccountCountOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class CountAccountsUseCase {
    async execute(): Promise<GetAccountCountOutput> {
        const [accountCount, churchCount] = await Promise.all([
            database.account.count(),
            database.church.count({
                where: {
                    organizations: { some: {} },
                },
            }),
        ]);

        return { accountCount, churchCount };
    }
}
