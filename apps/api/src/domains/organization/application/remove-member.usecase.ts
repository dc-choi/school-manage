/**
 * Remove Member UseCase
 *
 * 멤버 강퇴: ADMIN이 같은 조직 TEACHER를 조직에서 제거.
 * Account.organizationId/role을 null로 설정 (계정 자체는 살림).
 */
import { ROLE, type RemoveMemberInput, type RemoveMemberOutput, type Role } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class RemoveMemberUseCase {
    async execute(
        input: RemoveMemberInput,
        accountId: string,
        organizationId: string,
        role?: Role
    ): Promise<RemoveMemberOutput> {
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 멤버를 제거할 수 있습니다',
            });
        }

        if (input.targetAccountId === accountId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '자기 자신은 제거할 수 없습니다.',
            });
        }

        const now = getNowKST();
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

            if (target.role === ROLE.ADMIN) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: '관리자는 양도 후 제거할 수 있습니다.',
                });
            }

            await createAccountSnapshot(tx, {
                accountId: target.id,
                name: target.name,
                displayName: target.displayName,
                organizationId: orgId,
            });

            const result = await tx.account.updateMany({
                where: { id: targetId, organizationId: orgId, role: ROLE.TEACHER, deletedAt: null },
                data: { organizationId: null, role: null, updatedAt: now },
            });

            if (result.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '대상 멤버 상태가 변경되어 제거할 수 없습니다. 다시 시도해 주세요.',
                });
            }
        });

        return { success: true };
    }
}
