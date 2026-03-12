/**
 * List Organizations UseCase
 *
 * 본당 내 조직 목록 조회
 */
import type { ListOrganizationsInput, ListOrganizationsOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class ListOrganizationsUseCase {
    async execute(input: ListOrganizationsInput): Promise<ListOrganizationsOutput> {
        const organizations = await database.organization.findMany({
            where: {
                churchId: BigInt(input.churchId),
                deletedAt: null,
            },
            include: {
                _count: {
                    select: {
                        accounts: {
                            where: { deletedAt: null, organizationId: { not: null } },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return {
            organizations: organizations.map((org) => ({
                id: String(org.id),
                name: org.name,
                memberCount: org._count.accounts,
            })),
        };
    }
}
