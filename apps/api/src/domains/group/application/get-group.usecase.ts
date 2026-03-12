/**
 * Get Group UseCase
 *
 * 단일 그룹 조회 (학생 목록 포함)
 */
import type { GetGroupInput, GetGroupOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type GetGroupUseCaseInput = GetGroupInput & { organizationId: string };

export class GetGroupUseCase {
    async execute(input: GetGroupUseCaseInput): Promise<GetGroupOutput> {
        const group = await database.group.findFirst({
            where: {
                id: BigInt(input.id),
                organizationId: BigInt(input.organizationId),
                deletedAt: null,
            },
            include: {
                students: {
                    where: {
                        deletedAt: null,
                        graduatedAt: null,
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
                message: '학년을 찾을 수 없습니다.',
            });
        }

        return {
            id: String(group.id),
            name: group.name,
            organizationId: String(group.organizationId),
            studentCount: group.students.length,
            students: group.students.map((student) => ({
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                age: student.age ? Number(student.age) : undefined,
                contact: student.contact ? String(student.contact) : undefined,
                description: student.description ?? undefined,
                groups: [{ id: String(student.groupId), name: group.name }],
                baptizedAt: student.baptizedAt ?? undefined,
            })),
        };
    }
}
