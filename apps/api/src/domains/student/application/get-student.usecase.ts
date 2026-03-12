/**
 * Get Student UseCase
 *
 * 단일 학생 조회
 */
import type { Gender, GetStudentInput, GetStudentOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class GetStudentUseCase {
    async execute(input: GetStudentInput, organizationId: string): Promise<GetStudentOutput> {
        // 삭제된 학생도 조회 가능 (deletedAt 필터 제거)
        const student = await database.student.findFirst({
            where: {
                id: BigInt(input.id),
            },
            include: {
                studentGroups: {
                    include: {
                        group: { select: { id: true, name: true, organizationId: true } },
                    },
                },
            },
        });

        if (!student) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '학생을 찾을 수 없습니다.',
            });
        }

        // 권한 검증: 학생이 해당 조직 소속 그룹에 속하는지 확인
        const orgId = BigInt(organizationId);
        const hasAccess = student.studentGroups.some((sg) => sg.group.organizationId === orgId);

        if (!hasAccess) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: '해당 학생에 대한 접근 권한이 없습니다.',
            });
        }

        return {
            id: String(student.id),
            societyName: student.societyName,
            catholicName: student.catholicName ?? undefined,
            gender: (student.gender ?? undefined) as Gender | undefined,
            age: student.age != null ? Number(student.age) : undefined,
            contact: student.contact != null ? String(student.contact) : undefined,
            description: student.description ?? undefined,
            groups: student.studentGroups.map((sg) => ({
                id: String(sg.group.id),
                name: sg.group.name,
            })),
            baptizedAt: student.baptizedAt ?? undefined,
            deletedAt: student.deletedAt?.toISOString(),
        };
    }
}
