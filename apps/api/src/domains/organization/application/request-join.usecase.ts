/**
 * Request Join UseCase
 *
 * 기존 조직에 합류 요청
 */
import { JOIN_REQUEST_STATUS, type RequestJoinInput, type RequestJoinOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class RequestJoinUseCase {
    async execute(input: RequestJoinInput, accountId: string, organizationId?: string): Promise<RequestJoinOutput> {
        if (organizationId) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'CONFLICT: 이미 조직에 소속되어 있습니다',
            });
        }

        const existingRequest = await database.joinRequest.findFirst({
            where: {
                accountId: BigInt(accountId),
                organizationId: BigInt(input.organizationId),
                status: JOIN_REQUEST_STATUS.PENDING,
            },
        });

        if (existingRequest) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'CONFLICT: 이미 요청이 진행 중입니다',
            });
        }

        const now = getNowKST();
        const joinRequest = await database.joinRequest.create({
            data: {
                accountId: BigInt(accountId),
                organizationId: BigInt(input.organizationId),
                status: JOIN_REQUEST_STATUS.PENDING,
                createdAt: now,
                updatedAt: now,
            },
        });

        return {
            joinRequestId: String(joinRequest.id),
        };
    }
}
