/**
 * List Parishes UseCase
 *
 * 전체 교구 목록 조회
 */
import type { ListParishesOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class ListParishesUseCase {
    async execute(): Promise<ListParishesOutput> {
        const parishes = await database.parish.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'asc' },
        });

        return {
            parishes: parishes.map((parish) => ({
                id: String(parish.id),
                name: parish.name,
            })),
        };
    }
}
