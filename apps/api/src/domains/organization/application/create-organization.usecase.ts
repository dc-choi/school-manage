/**
 * Create Organization UseCase
 *
 * 조직 생성 + 생성자를 admin으로 설정
 */
import { type CreateOrganizationInput, type CreateOrganizationOutput, ORGANIZATION_TYPE, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { createAccountSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class CreateOrganizationUseCase {
    async execute(input: CreateOrganizationInput, accountId: string): Promise<CreateOrganizationOutput> {
        const now = getNowKST();

        const result = await database.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: input.name,
                    type: input.type ?? ORGANIZATION_TYPE.MIDDLE_HIGH,
                    churchId: BigInt(input.churchId),
                    createdAt: now,
                },
            });

            const account = await tx.account.update({
                where: { id: BigInt(accountId) },
                data: {
                    organizationId: organization.id,
                    role: ROLE.ADMIN,
                    updatedAt: now,
                },
            });

            await createAccountSnapshot(tx, {
                accountId: account.id,
                name: account.name,
                displayName: account.displayName,
                organizationId: organization.id,
            });

            // 기존 Group/Student 데이터를 새 조직에 연결
            await tx.group.updateMany({
                where: { accountId: BigInt(accountId), organizationId: null },
                data: { organizationId: organization.id },
            });

            await tx.student.updateMany({
                where: {
                    studentGroups: { some: { group: { accountId: BigInt(accountId) } } },
                    organizationId: null,
                },
                data: { organizationId: organization.id },
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
