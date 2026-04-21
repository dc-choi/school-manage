/**
 * Approve Join UseCase
 *
 * 합류 요청 승인 (admin 전용)
 */
import { type ApproveJoinInput, JOIN_REQUEST_STATUS, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class ApproveJoinUseCase {
    async execute(input: ApproveJoinInput, organizationId: string, role?: string): Promise<void> {
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 합류 요청을 승인할 수 있습니다',
            });
        }

        const now = getNowKST();

        await database.$transaction(async (tx) => {
            const joinRequest = await tx.joinRequest.findFirst({
                where: {
                    id: BigInt(input.joinRequestId),
                    organizationId: BigInt(organizationId),
                },
            });

            if (!joinRequest) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'NOT_FOUND: 합류 요청을 찾을 수 없습니다',
                });
            }

            // 조건부 업데이트: PENDING 상태에서만 성공.
            // 동시 승인 시 먼저 커밋된 트랜잭션만 count=1, 이후 요청은 count=0으로 race 감지
            const approved = await tx.joinRequest.updateMany({
                where: {
                    id: joinRequest.id,
                    status: JOIN_REQUEST_STATUS.PENDING,
                },
                data: { status: JOIN_REQUEST_STATUS.APPROVED, updatedAt: now },
            });

            if (approved.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'CONFLICT: 이미 처리된 합류 요청입니다',
                });
            }

            const account = await tx.account.update({
                where: { id: joinRequest.accountId },
                data: {
                    organizationId: BigInt(organizationId),
                    role: ROLE.TEACHER,
                    updatedAt: now,
                },
            });

            await createAccountSnapshot(tx, {
                accountId: account.id,
                name: account.name,
                displayName: account.displayName,
                organizationId: BigInt(organizationId),
            });
        });
    }
}
