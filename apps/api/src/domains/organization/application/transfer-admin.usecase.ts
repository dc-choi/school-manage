/**
 * Transfer Admin UseCase
 *
 * 관리자 양도: ADMIN → TEACHER 역할 교환 (atomic)
 */
import { ROLE, type Role, type TransferAdminInput, type TransferAdminOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class TransferAdminUseCase {
    async execute(
        input: TransferAdminInput,
        accountId: string,
        organizationId: string,
        role?: Role
    ): Promise<TransferAdminOutput> {
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 관리자를 양도할 수 있습니다',
            });
        }

        if (input.targetAccountId === accountId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '자기 자신에게 양도할 수 없습니다.',
            });
        }

        const now = getNowKST();
        const callerId = BigInt(accountId);
        const targetId = BigInt(input.targetAccountId);
        const orgId = BigInt(organizationId);

        await database.$transaction(async (tx): Promise<void> => {
            const target = await tx.account.findFirst({
                where: { id: targetId, organizationId: orgId, deletedAt: null },
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

            const currentAdmin = await tx.account.findFirst({
                where: { id: callerId, organizationId: orgId, deletedAt: null },
                select: { id: true, name: true, displayName: true },
            });

            if (!currentAdmin) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '현재 관리자 계정을 찾을 수 없습니다.',
                });
            }

            const demoteResult = await tx.account.updateMany({
                where: { id: callerId, organizationId: orgId, role: ROLE.ADMIN, deletedAt: null },
                data: { role: ROLE.TEACHER, updatedAt: now },
            });

            if (demoteResult.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '관리자 상태가 변경되어 양도할 수 없습니다. 다시 시도해 주세요.',
                });
            }

            await createAccountSnapshot(tx, {
                accountId: currentAdmin.id,
                name: currentAdmin.name,
                displayName: currentAdmin.displayName,
                organizationId: orgId,
            });

            const promoteResult = await tx.account.updateMany({
                where: { id: targetId, organizationId: orgId, role: ROLE.TEACHER, deletedAt: null },
                data: { role: ROLE.ADMIN, updatedAt: now },
            });

            if (promoteResult.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '대상 계정 상태가 변경되어 양도할 수 없습니다. 다시 시도해 주세요.',
                });
            }

            await createAccountSnapshot(tx, {
                accountId: target.id,
                name: target.name,
                displayName: target.displayName,
                organizationId: orgId,
            });
        });

        return { success: true };
    }
}
