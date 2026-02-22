/**
 * Get Student UseCase
 *
 * 단일 학생 조회
 */
import type { GetStudentInput, GetStudentOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class GetStudentUseCase {
    async execute(input: GetStudentInput): Promise<GetStudentOutput> {
        // 삭제된 학생도 조회 가능 (deletedAt 필터 제거)
        const student = await database.student.findFirst({
            where: {
                id: BigInt(input.id),
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
            gender: student.gender ?? undefined,
            age: student.age != null ? Number(student.age) : undefined,
            contact: student.contact != null ? Number(student.contact) : undefined,
            description: student.description ?? undefined,
            groupId: String(student.groupId),
            baptizedAt: student.baptizedAt ?? undefined,
            deletedAt: student.deletedAt?.toISOString(),
        };
    }
}
