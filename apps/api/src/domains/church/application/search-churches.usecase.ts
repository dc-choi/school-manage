/**
 * Search Churches UseCase
 *
 * 교구 내 본당 검색
 */
import type { SearchChurchesInput, SearchChurchesOutput } from '@school/shared';
import { normalizeChurchName } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

export class SearchChurchesUseCase {
    async execute(input: SearchChurchesInput): Promise<SearchChurchesOutput> {
        // 검색어도 정규화하여 공백 변형 무관하게 매칭 ("반포동 성당" → "반포동성당")
        const normalizedQuery = input.query ? normalizeChurchName(input.query) : '';

        const churches = await database.church.findMany({
            where: {
                parishId: BigInt(input.parishId),
                deletedAt: null,
                ...(normalizedQuery ? { normalizedName: { contains: normalizedQuery } } : {}),
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
