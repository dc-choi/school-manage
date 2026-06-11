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
                data: { status: JOIN_REQUEST_STATUS.APPROVED, pendingLock: null, updatedAt: now },
            });

            if (approved.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'CONFLICT: 이미 처리된 합류 요청입니다',
                });
            }

            // 조건부 업데이트: 미소속(organizationId=null) + 미삭제(deletedAt=null) 계정만 배정 성공.
            // 옛 PENDING 승인 시 이미 다른 조직에 소속됐거나 삭제된 계정의 조용한 조직 이동/부활을 차단한다.
            const assigned = await tx.account.updateMany({
                where: {
                    id: joinRequest.accountId,
                    organizationId: null,
                    deletedAt: null,
                },
                data: {
                    organizationId: BigInt(organizationId),
                    role: ROLE.TEACHER,
                    updatedAt: now,
                },
            });

            if (assigned.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'CONFLICT: 이미 다른 조직에 소속됐거나 탈퇴한 계정입니다',
                });
            }

            // updateMany는 row를 반환하지 않으므로 스냅샷용 필드만 한정해 재조회한다.
            const account = await tx.account.findUnique({
                where: { id: joinRequest.accountId },
                select: { id: true, name: true, displayName: true },
            });

            // 같은 트랜잭션에서 방금 조건부 갱신에 성공한 행이라 정상 경로에서는 도달 불가
            if (!account) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'INTERNAL_SERVER_ERROR: 계정 재조회에 실패했습니다',
                });
            }

            await createAccountSnapshot(tx, {
                accountId: account.id,
                name: account.name,
                displayName: account.displayName,
                organizationId: BigInt(organizationId),
            });
        });
    }
}
