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

        // 조직 소유 요청 존재 확인 (없으면 NOT_FOUND)
        const joinRequest = await database.joinRequest.findFirst({
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

        // 조건부 업데이트: PENDING 상태에서만 성공. 동시 승인/거부 시 먼저 커밋된 쪽만 count=1,
        // 이후 요청은 count=0으로 race 감지 (approve-join과 동일 패턴 — APPROVED 행을 REJECTED로 덮어쓰는 race 차단).
        const rejected = await database.joinRequest.updateMany({
            where: {
                id: joinRequest.id,
                status: JOIN_REQUEST_STATUS.PENDING,
            },
            data: { status: JOIN_REQUEST_STATUS.REJECTED, pendingLock: null, updatedAt: getNowKST() },
        });

        if (rejected.count === 0) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'CONFLICT: 이미 처리된 합류 요청입니다',
            });
        }
    }
}
