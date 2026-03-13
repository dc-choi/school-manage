/**
 * Delete Account UseCase
 *
 * 계정 삭제 비즈니스 로직
 * 비밀번호 검증 → 계정 소프트 삭제 + 강제 로그아웃
 * 학년/학생/출석 데이터는 보존 (조직의 자산)
 */
import { type DeleteAccountInput, type DeleteAccountOutput, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { database } from '~/infrastructure/database/database.js';

export class DeleteAccountUseCase {
    async execute(input: DeleteAccountInput, accountId: string, role?: string): Promise<DeleteAccountOutput> {
        // 0. 관리자 계정 삭제 차단
        if (role === ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: '관리자 계정은 삭제할 수 없습니다.',
            });
        }

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

        // 2. 비밀번호 검증
        const isValid = bcrypt.compareSync(input.password, account.password);
        if (!isValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '비밀번호가 일치하지 않습니다.',
            });
        }

        // 3. 계정 소프트 삭제 + 강제 로그아웃
        const now = getNowKST();

        await database.$transaction(async (tx) => {
            // 3a. 계정 소프트 삭제 + 조직 연결 해제
            await tx.account.update({
                where: { id: account.id },
                data: { deletedAt: now, organizationId: null },
            });

            // 3b. 모든 Refresh Token 삭제 (강제 로그아웃)
            await tx.refreshToken.deleteMany({
                where: { accountId: account.id },
            });
        });

        return { success: true };
    }
}
