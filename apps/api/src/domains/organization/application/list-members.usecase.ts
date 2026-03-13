/**
 * List Members UseCase
 *
 * 조직 멤버 목록 조회
 */
import { type MembersOutput, ROLE, type Role } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class ListMembersUseCase {
    async execute(organizationId: string): Promise<MembersOutput> {
        const accounts = await database.account.findMany({
            where: {
                organizationId: BigInt(organizationId),
                deletedAt: null,
            },
            select: {
                id: true,
                displayName: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        return {
            members: accounts.map((account) => ({
                id: String(account.id),
                displayName: account.displayName,
                role: (account.role ?? ROLE.TEACHER) as Role,
                joinedAt: account.createdAt.toISOString(),
            })),
        };
    }
}
