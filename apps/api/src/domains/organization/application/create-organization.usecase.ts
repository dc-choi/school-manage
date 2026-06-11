/**
 * Create Organization UseCase
 *
 * 조직 생성 + 생성자를 admin으로 설정
 */
import { type CreateOrganizationInput, type CreateOrganizationOutput, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class CreateOrganizationUseCase {
    async execute(input: CreateOrganizationInput, accountId: string): Promise<CreateOrganizationOutput> {
        const now = getNowKST();

        const result = await database.$transaction(async (tx) => {
            const existingOrg = await tx.organization.findFirst({
                where: {
                    name: input.name,
                    churchId: BigInt(input.churchId),
                    deletedAt: null,
                },
            });

            if (existingOrg) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '이미 존재하는 단체명입니다.',
                });
            }

            const organization = await tx.organization.create({
                data: {
                    name: input.name,
                    type: input.type,
                    churchId: BigInt(input.churchId),
                    createdAt: now,
                },
            });

            // 조건부 업데이트: 미소속(organizationId=null) + 미삭제(deletedAt=null) 계정만 ADMIN 배정 성공.
            // 소속 계정의 조용한 조직 이탈(유일 ADMIN이면 구 조직이 관리자 0명으로 고아화)을 차단한다 (O-1 패턴).
            const assigned = await tx.account.updateMany({
                where: {
                    id: BigInt(accountId),
                    organizationId: null,
                    deletedAt: null,
                },
                data: {
                    organizationId: organization.id,
                    role: ROLE.ADMIN,
                    updatedAt: now,
                },
            });

            if (assigned.count === 0) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'CONFLICT: 이미 조직에 소속되어 있거나 탈퇴한 계정입니다',
                });
            }

            // updateMany는 row를 반환하지 않으므로 스냅샷용 필드만 한정해 재조회한다.
            const account = await tx.account.findUnique({
                where: { id: BigInt(accountId) },
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
                organizationId: organization.id,
            });

            return organization;
        });

        return {
            id: String(result.id),
            name: result.name,
            churchId: String(result.churchId),
            type: result.type,
        };
    }
}
