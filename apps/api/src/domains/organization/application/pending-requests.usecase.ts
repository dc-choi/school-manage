/**
 * Pending Requests UseCase
 *
 * 조직의 대기 중인 합류 요청 목록 (admin 전용)
 */
import { JOIN_REQUEST_STATUS, type PendingRequestsOutput, ROLE } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class PendingRequestsUseCase {
    async execute(organizationId: string, role?: string): Promise<PendingRequestsOutput> {
        if (role !== ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: admin만 합류 요청을 조회할 수 있습니다',
            });
        }

        const requests = await database.joinRequest.findMany({
            where: {
                organizationId: BigInt(organizationId),
                status: JOIN_REQUEST_STATUS.PENDING,
            },
            include: {
                account: {
                    select: { displayName: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return {
            requests: requests.map((req) => ({
                id: String(req.id),
                accountDisplayName: req.account.displayName,
                createdAt: req.createdAt.toISOString(),
            })),
        };
    }
}
