/**
 * Count Accounts UseCase
 *
 * 전체 가입 계정 수 조회 (소프트 삭제 제외)
 */
import type { GetAccountCountOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class CountAccountsUseCase {
    async execute(): Promise<GetAccountCountOutput> {
        const count = await database.account.count({
            where: { deletedAt: null },
        });

        return { count };
    }
}
