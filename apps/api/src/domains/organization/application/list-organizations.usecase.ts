/**
 * List Organizations UseCase
 *
 * 본당 내 조직 목록 조회 (페이지네이션)
 */
import { Prisma } from '@prisma/client';
import type { ListOrganizationsInput, ListOrganizationsOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class ListOrganizationsUseCase {
    async execute(input: ListOrganizationsInput): Promise<ListOrganizationsOutput> {
        const page = input.page ?? 1;
        const size = 10;
        const skip = (page - 1) * size;

        const where: Prisma.OrganizationWhereInput = {
            churchId: BigInt(input.churchId),
            deletedAt: null,
        };

        const [organizations, total] = await Promise.all([
            database.organization.findMany({
                where,
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
                skip,
                take: size,
            }),
            database.organization.count({ where }),
        ]);

        return {
            page,
            size,
            total,
            totalPage: Math.ceil(total / size),
            organizations: organizations.map((org) => ({
                id: String(org.id),
                name: org.name,
                memberCount: org._count.accounts,
            })),
        };
    }
}
