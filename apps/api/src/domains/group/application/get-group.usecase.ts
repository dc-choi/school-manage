/**
 * Get Group UseCase
 *
 * 단일 그룹 조회 (학생 목록 포함)
 */
import type { GetGroupInput, GetGroupOutput } from '@school/shared';
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
                studentGroups: {
                    where: {
                        student: {
                            deletedAt: null,
                            graduatedAt: null,
                        },
                    },
                    include: {
                        student: true,
                    },
                    orderBy: {
                        student: { societyName: 'asc' },
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
            type: group.type,
            organizationId: String(group.organizationId),
            studentCount: group.studentGroups.length,
            students: group.studentGroups.map((sg) => ({
                id: String(sg.student.id),
                societyName: sg.student.societyName,
                catholicName: sg.student.catholicName ?? undefined,
                age: sg.student.age ? Number(sg.student.age) : undefined,
                contact: sg.student.contact ? String(sg.student.contact) : undefined,
                description: sg.student.description ?? undefined,
                groups: [{ id: String(group.id), name: group.name, type: group.type }],
                baptizedAt: sg.student.baptizedAt ?? undefined,
            })),
        };
    }
}
