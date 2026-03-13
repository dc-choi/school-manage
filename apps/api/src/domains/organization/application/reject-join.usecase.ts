/**
 * Reject Join UseCase
 *
 * 합류 요청 거부 (admin 전용)
 */
import { JOIN_REQUEST_STATUS, ROLE, type RejectJoinInput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class RejectJoinUseCase {
    async execute(input: RejectJoinInput, organizationId: string, role?: string): Promise<void> {
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 합류 요청을 거부할 수 있습니다',
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

        await database.joinRequest.update({
            where: { id: joinRequest.id },
            data: { status: JOIN_REQUEST_STATUS.REJECTED, updatedAt: getNowKST() },
        });
    }
}
