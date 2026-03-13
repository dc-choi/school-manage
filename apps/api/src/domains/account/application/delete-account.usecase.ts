/**
 * Delete Account UseCase
 *
 * 계정 삭제 비즈니스 로직
 * - TEACHER: 비밀번호 검증 → 계정 소프트 삭제 + 강제 로그아웃
 * - ADMIN (유일 멤버): 비밀번호 검증 → 조직 소프트 삭제 + 계정 소프트 삭제
 * - ADMIN (다른 멤버 존재): 차단 (먼저 양도 필요)
 */
import { type DeleteAccountInput, type DeleteAccountOutput, JOIN_REQUEST_STATUS, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { database } from '~/infrastructure/database/database.js';

export class DeleteAccountUseCase {
    async execute(
        input: DeleteAccountInput,
        accountId: string,
        role?: string,
        organizationId?: string
    ): Promise<DeleteAccountOutput> {
        // 0. ADMIN + 다른 멤버 존재 시 차단
        if (role === ROLE.ADMIN && organizationId) {
            const memberCount = await database.account.count({
                where: { organizationId: BigInt(organizationId), deletedAt: null },
            });

            if (memberCount > 1) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: '먼저 관리자를 양도한 후 탈퇴할 수 있습니다.',
                });
            }
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

        const now = getNowKST();

        // 3. ADMIN 유일 멤버: 조직 소프트 삭제 + 계정 소프트 삭제
        if (role === ROLE.ADMIN && organizationId) {
            await database.$transaction(async (tx) => {
                const orgId = BigInt(organizationId);

                // 3a. 대기 중인 합류 요청 거부
                await tx.joinRequest.updateMany({
                    where: { organizationId: orgId, status: JOIN_REQUEST_STATUS.PENDING },
                    data: { status: JOIN_REQUEST_STATUS.REJECTED, updatedAt: now },
                });

                // 3b. 학생 소프트 삭제
                await tx.student.updateMany({
                    where: { organizationId: orgId, deletedAt: null },
                    data: { deletedAt: now },
                });

                // 3c. 그룹 소프트 삭제
                await tx.group.updateMany({
                    where: { organizationId: orgId, deletedAt: null },
                    data: { deletedAt: now },
                });

                // 3d. 조직 소프트 삭제
                await tx.organization.update({
                    where: { id: orgId },
                    data: { deletedAt: now },
                });

                // 3e. 계정 소프트 삭제 + 조직 연결 해제
                await tx.account.update({
                    where: { id: account.id },
                    data: { deletedAt: now, organizationId: null },
                });

                // 3f. 모든 Refresh Token 삭제
                await tx.refreshToken.deleteMany({
                    where: { accountId: account.id },
                });
            });

            return { success: true };
        }

        // 4. TEACHER: 기존 로직 (계정 소프트 삭제만)
        await database.$transaction(async (tx) => {
            await tx.account.update({
                where: { id: account.id },
                data: { deletedAt: now, organizationId: null },
            });

            await tx.refreshToken.deleteMany({
                where: { accountId: account.id },
            });
        });

        return { success: true };
    }
}
