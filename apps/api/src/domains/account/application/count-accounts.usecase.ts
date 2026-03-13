/**
 * Count Accounts UseCase
 *
 * 전체 가입 계정 수 + 성당 수 조회 (소프트 삭제 제외)
 */
import type { GetAccountCountOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class CountAccountsUseCase {
    async execute(): Promise<GetAccountCountOutput> {
        const [accountCount, churchCount] = await Promise.all([
            database.account.count({
                where: { deletedAt: null },
            }),
            database.church.count({
                where: {
                    deletedAt: null,
                    organizations: { some: { deletedAt: null } },
                },
            }),
        ]);

        return { accountCount, churchCount };
    }
}
