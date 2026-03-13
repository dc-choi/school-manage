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

        const joinRequest = await database.joinRequest.findFirst({
            where: {
                id: BigInt(input.joinRequestId),
                organizationId: BigInt(organizationId),
                status: JOIN_REQUEST_STATUS.PENDING,
            },
        });

        if (!joinRequest) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'NOT_FOUND: 합류 요청을 찾을 수 없습니다',
            });
        }

        const now = getNowKST();

        await database.$transaction(async (tx) => {
            await tx.joinRequest.update({
                where: { id: joinRequest.id },
                data: { status: JOIN_REQUEST_STATUS.APPROVED, updatedAt: now },
            });

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

            // 기존 Group/Student 데이터를 가입한 조직에 연결
            await tx.group.updateMany({
                where: { accountId: joinRequest.accountId, organizationId: null },
                data: { organizationId: BigInt(organizationId) },
            });

            await tx.student.updateMany({
                where: {
                    studentGroups: { some: { group: { accountId: joinRequest.accountId } } },
                    organizationId: null,
                },
                data: { organizationId: BigInt(organizationId) },
            });
        });
    }
}
