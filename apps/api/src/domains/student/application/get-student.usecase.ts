/**
 * Get Student UseCase
 *
 * 단일 학생 조회
 */
import type { Gender, GetStudentInput, GetStudentOutput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class GetStudentUseCase {
    async execute(input: GetStudentInput, organizationId: string): Promise<GetStudentOutput> {
        // 삭제된 학생도 조회 가능 (deletedAt 필터 제거)
        // 권한 검증: organizationId를 where절에 포함하여 타 조직 접근 차단
        const student = await database.student.findFirst({
            where: {
                id: BigInt(input.id),
                organizationId: BigInt(organizationId),
            },
            include: {
                studentGroups: {
                    where: { group: { deletedAt: null } },
                    include: {
                        group: { select: { id: true, name: true, type: true } },
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
                type: sg.group.type,
            })),
            baptizedAt: student.baptizedAt ?? undefined,
            deletedAt: student.deletedAt?.toISOString(),
        };
    }
}
