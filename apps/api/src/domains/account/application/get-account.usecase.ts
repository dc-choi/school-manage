/**
 * Get Account UseCase
 *
 * 인증된 사용자의 계정 정보 반환 (DB 조회)
 */
import type { AccountInfo, GetAccountOutput, JoinRequestStatus, Role } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class GetAccountUseCase {
    async execute(account: AccountInfo): Promise<GetAccountOutput> {
        const found = await database.account.findFirst({
            where: { id: BigInt(account.id), deletedAt: null },
            select: {
                id: true,
                name: true,
                displayName: true,
                createdAt: true,
                privacyAgreedAt: true,
                privacyPolicyVersion: true,
                organizationId: true,
                role: true,
            },
        });

        if (!found) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        const { id, name, displayName, createdAt, privacyAgreedAt, privacyPolicyVersion, organizationId, role } = found;

        // 가입 후 경과일: DB/서버 모두 KST 기준이므로 getNowKST() - createdAt 델타로 정합하게 계산
        const signupDays = Math.max(0, Math.floor((getNowKST().getTime() - createdAt.getTime()) / MS_PER_DAY));

        const result: GetAccountOutput = {
            id: String(id),
            name,
            displayName,
            signupDays,
            privacyAgreedAt,
            privacyPolicyVersion,
        };

        // 조직 소속 시 조직명, 본당명 포함
        if (organizationId) {
            result.organizationId = String(organizationId);
            result.role = (role as Role) ?? undefined;

            const organization = await database.organization.findFirst({
                where: { id: organizationId, deletedAt: null },
                select: {
                    name: true,
                    type: true,
                    church: {
                        select: { name: true },
                    },
                },
            });

            if (organization) {
                result.organizationName = organization.name;
                result.organizationType = organization.type;
                result.churchName = organization.church.name;
            }
        } else {
            // 조직 미소속 시 최신 합류 요청 상태 조회
            const latestJoinRequest = await database.joinRequest.findFirst({
                where: { accountId: BigInt(account.id) },
                orderBy: { createdAt: 'desc' },
                select: { status: true },
            });

            if (latestJoinRequest) {
                result.joinRequestStatus = latestJoinRequest.status as JoinRequestStatus;
            }
        }

        return result;
    }
}
