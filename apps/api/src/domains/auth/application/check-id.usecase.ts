/**
 * Check ID UseCase
 *
 * ID 중복 확인 비즈니스 로직
 */
import type { CheckIdInput, CheckIdOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class CheckIdUseCase {
    async execute(input: CheckIdInput): Promise<CheckIdOutput> {
        // ID를 소문자로 정규화
        const normalizedName = input.name.toLowerCase();

        // 계정 존재 여부 확인 — DB UNIQUE와 동일하게 탈퇴(soft-delete) 계정 포함
        // (탈퇴 계정 name은 restoreAccount 예약 슬롯이라 가입 불가, 예약 여부는 미노출)
        const existingAccount = await database.account.findFirst({
            where: {
                name: normalizedName,
            },
        });

        return {
            available: existingAccount === null,
        };
    }
}
