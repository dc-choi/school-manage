/**
 * Transfer Admin UseCase
 *
 * 관리자 양도: ADMIN → TEACHER 역할 교환 (atomic)
 */
import { ROLE, type TransferAdminInput, type TransferAdminOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class TransferAdminUseCase {
    async execute(
        input: TransferAdminInput,
        accountId: string,
        organizationId: string,
        role?: string
    ): Promise<TransferAdminOutput> {
        // 1. ADMIN 권한 확인
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 관리자를 양도할 수 있습니다',
            });
        }

        // 2. 자기 자신에게 양도 불가
        if (input.targetAccountId === accountId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '자기 자신에게 양도할 수 없습니다.',
            });
        }

        // 3. 대상 계정 검증 (같은 조직 + TEACHER)
        const target = await database.account.findFirst({
            where: {
                id: BigInt(input.targetAccountId),
                organizationId: BigInt(organizationId),
                deletedAt: null,
            },
            select: { id: true, name: true, displayName: true, role: true },
        });

        if (!target) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '대상 계정을 찾을 수 없습니다.',
            });
        }

        if (target.role !== ROLE.TEACHER) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '선생님 역할의 계정에게만 양도할 수 있습니다.',
            });
        }

        // 4. 트랜잭션: 역할 교환
        const now = getNowKST();

        await database.$transaction(async (tx) => {
            // 4a. 현재 ADMIN → TEACHER
            const currentAdmin = await tx.account.update({
                where: { id: BigInt(accountId) },
                data: { role: ROLE.TEACHER, updatedAt: now },
            });

            await createAccountSnapshot(tx, {
                accountId: currentAdmin.id,
                name: currentAdmin.name,
                displayName: currentAdmin.displayName,
                organizationId: BigInt(organizationId),
            });

            // 4b. 대상 TEACHER → ADMIN
            const newAdmin = await tx.account.update({
                where: { id: target.id },
                data: { role: ROLE.ADMIN, updatedAt: now },
            });

            await createAccountSnapshot(tx, {
                accountId: newAdmin.id,
                name: newAdmin.name,
                displayName: newAdmin.displayName,
                organizationId: BigInt(organizationId),
            });
        });

        return { success: true };
    }
}
