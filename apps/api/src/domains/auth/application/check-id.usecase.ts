/**
 * Check ID UseCase
 *
 * ID 중복 확인 비즈니스 로직
 */
import type { CheckIdInput, CheckIdOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class CheckIdUseCase {
    async execute(input: CheckIdInput): Promise<CheckIdOutput> {
        // ID를 소문자로 정규화
        const normalizedName = input.name.toLowerCase();

        // 계정 존재 여부 확인
        const existingAccount = await database.account.findFirst({
            where: {
                name: normalizedName,
                deletedAt: null,
            },
        });

        return {
            available: existingAccount === null,
        };
    }
}
