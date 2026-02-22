/**
 * Change Password UseCase
 *
 * 비밀번호 변경 비즈니스 로직
 * 현재 비밀번호 검증 → 새 비밀번호 해싱 → DB 업데이트
 */
import type { ChangePasswordInput, ChangePasswordOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { database } from '~/infrastructure/database/database.js';

export class ChangePasswordUseCase {
    async execute(input: ChangePasswordInput, accountId: string): Promise<ChangePasswordOutput> {
        // 1. 계정 조회 (비밀번호 포함)
        const account = await database.account.findFirst({
            where: { id: BigInt(accountId), deletedAt: null },
            select: { id: true, password: true },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 2. 현재 비밀번호 검증
        const isValid = bcrypt.compareSync(input.currentPassword, account.password);
        if (!isValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '현재 비밀번호가 일치하지 않습니다.',
            });
        }

        // 3. 새 비밀번호 해싱 → DB 업데이트
        const hashedPassword = bcrypt.hashSync(input.newPassword, 10);
        await database.account.update({
            where: { id: account.id },
            data: {
                password: hashedPassword,
                updatedAt: getNowKST(),
            },
        });

        return { success: true };
    }
}
