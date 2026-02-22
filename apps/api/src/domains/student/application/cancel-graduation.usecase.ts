/**
 * Cancel Graduation UseCase
 *
 * 학생 졸업 취소 (graduatedAt을 null로 설정)
 */
import type { CancelGraduationInput, CancelGraduationOutput, GraduatedStudent } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

type CancelGraduationUseCaseInput = CancelGraduationInput & { accountId: string };

export class CancelGraduationUseCase {
    async execute(input: CancelGraduationUseCaseInput): Promise<CancelGraduationOutput> {
        const { ids, accountId } = input;

        try {
            return await database.$transaction(async (tx) => {
                // 본인 계정의 졸업생만 조회
                const students = await tx.student.findMany({
                    where: {
                        id: { in: ids.map((id) => BigInt(id)) },
                        graduatedAt: { not: null }, // 졸업생만
                        deletedAt: null,
                        group: {
                            accountId: BigInt(accountId),
                        },
                    },
                    include: { group: true },
                });

                // 졸업 취소
                const cancelledStudents: GraduatedStudent[] = [];

                for (const student of students) {
                    await tx.student.update({
                        where: { id: student.id },
                        data: { graduatedAt: null },
                    });
                    cancelledStudents.push({
                        id: String(student.id),
                        societyName: student.societyName,
                        graduatedAt: null,
                    });
                }

                return {
                    success: true,
                    cancelledCount: cancelledStudents.length,
                    students: cancelledStudents,
                };
            });
        } catch (e) {
            if (e instanceof TRPCError) {
                throw e;
            }
            console.error('[CancelGraduationUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '졸업 취소에 실패했습니다.',
            });
        }
    }
}
