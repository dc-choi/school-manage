/**
 * Get Group UseCase
 *
 * 단일 그룹 조회 (학생 목록 포함)
 */
import type { GetGroupInput, GetGroupOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class GetGroupUseCase {
    async execute(input: GetGroupInput): Promise<GetGroupOutput> {
        const group = await database.group.findFirst({
            where: {
                id: BigInt(input.id),
                deletedAt: null,
            },
            include: {
                students: {
                    where: {
                        deletedAt: null,
                    },
                    orderBy: {
                        societyName: 'asc',
                    },
                },
            },
        });

        if (!group) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `NOT_FOUND: GROUP NOT_FOUND, group_id: ${input.id}`,
            });
        }

        return {
            id: String(group.id),
            name: group.name,
            accountId: String(group.accountId),
            studentCount: group.students.length,
            students: group.students.map((student) => ({
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                age: student.age ? Number(student.age) : undefined,
                contact: student.contact ? Number(student.contact) : undefined,
                description: student.description ?? undefined,
                groupId: String(student.groupId),
                baptizedAt: student.baptizedAt ?? undefined,
            })),
        };
    }
}
