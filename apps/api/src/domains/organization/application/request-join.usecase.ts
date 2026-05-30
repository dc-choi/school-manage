/**
 * Request Join UseCase
 *
 * 기존 조직에 합류 요청
 */
import { Prisma } from '@prisma/client';
import { JOIN_REQUEST_STATUS, type RequestJoinInput, type RequestJoinOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';

export class RequestJoinUseCase {
    async execute(input: RequestJoinInput, accountId: string, organizationId?: string): Promise<RequestJoinOutput> {
        if (organizationId) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'CONFLICT: 이미 조직에 소속되어 있습니다',
            });
        }

        // 미소속 계정은 동시에 1개 조직에만 합류 요청 가능 (A-3).
        // status=PENDING만 차단 — 과거 REJECTED/APPROVED 이력은 재요청을 막지 않는다.
        const pendingRequest = await database.joinRequest.findFirst({
            where: {
                accountId: BigInt(accountId),
                status: JOIN_REQUEST_STATUS.PENDING,
            },
        });

        if (pendingRequest) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'CONFLICT: 이미 진행 중인 합류 요청이 있습니다',
            });
        }

        const now = getNowKST();
        try {
            const joinRequest = await database.joinRequest.create({
                data: {
                    accountId: BigInt(accountId),
                    organizationId: BigInt(input.organizationId),
                    status: JOIN_REQUEST_STATUS.PENDING,
                    pendingLock: true,
                    createdAt: now,
                    updatedAt: now,
                },
            });

            return {
                joinRequestId: String(joinRequest.id),
            };
        } catch (e) {
            // (accountId, pending_lock) UNIQUE 제약으로 동시 요청 경합 차단 (findFirst-create race 백스톱, A-3).
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                logger.log('[request-join] pending lock collision on DB unique', { accountId });
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'CONFLICT: 이미 진행 중인 합류 요청이 있습니다',
                });
            }
            throw e;
        }
    }
}
