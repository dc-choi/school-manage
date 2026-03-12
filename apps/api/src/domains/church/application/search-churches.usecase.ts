/**
 * Search Churches UseCase
 *
 * 교구 내 본당 검색
 */
import type { SearchChurchesInput, SearchChurchesOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class SearchChurchesUseCase {
    async execute(input: SearchChurchesInput): Promise<SearchChurchesOutput> {
        const churches = await database.church.findMany({
            where: {
                parishId: BigInt(input.parishId),
                deletedAt: null,
                ...(input.query ? { name: { contains: input.query } } : {}),
            },
            include: {
                _count: {
                    select: {
                        organizations: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return {
            churches: churches.map((church) => ({
                id: String(church.id),
                name: church.name,
                organizationCount: church._count.organizations,
            })),
        };
    }
}
