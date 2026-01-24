/**
 * List Groups UseCase
 *
 * 계정에 속한 모든 그룹 목록 조회
 */
import type { ListGroupsOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class ListGroupsUseCase {
    async execute(accountId: string): Promise<ListGroupsOutput> {
        const groups = await database.group.findMany({
            where: {
                accountId: BigInt(accountId),
                deletedAt: null,
            },
            include: {
                _count: {
                    select: {
                        students: {
                            where: {
                                deletedAt: null,
                                graduatedAt: null,
                            },
                        },
                    },
                },
            },
        });

        return {
            groups: groups.map((group) => ({
                id: String(group.id),
                name: group.name,
                accountId: String(group.accountId),
                studentCount: group._count.students,
            })),
        };
    }
}
