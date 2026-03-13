/**
 * List Groups UseCase
 *
 * 계정에 속한 모든 그룹 목록 조회
 */
import type { ListGroupsOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class ListGroupsUseCase {
    async execute(organizationId: string, type?: string): Promise<ListGroupsOutput> {
        const groups = await database.group.findMany({
            where: {
                organizationId: BigInt(organizationId),
                deletedAt: null,
                ...(type ? { type } : {}),
            },
            include: {
                _count: {
                    select: {
                        studentGroups: {
                            where: {
                                student: {
                                    deletedAt: null,
                                    graduatedAt: null,
                                },
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
                type: group.type,
                organizationId: String(group.organizationId),
                studentCount: group._count.studentGroups,
            })),
        };
    }
}
