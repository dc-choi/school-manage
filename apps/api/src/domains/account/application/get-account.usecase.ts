/**
 * Get Account UseCase
 *
 * 인증된 사용자의 계정 정보 반환
 */
import type { AccountInfo, GetAccountOutput } from '@school/trpc';

export class GetAccountUseCase {
    execute(account: AccountInfo): GetAccountOutput {
        return {
            id: account.id,
            name: account.name,
        };
    }
}
