/**
 * Graduate Students UseCase
 *
 * 학생 일괄 졸업 처리 (graduatedAt 설정)
 */
import type { GraduateStudentsInput, GraduateStudentsOutput, GraduatedStudent } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { ga4 } from '~/infrastructure/analytics/ga4.js';
import { database } from '~/infrastructure/database/database.js';

type GraduateStudentsUseCaseInput = GraduateStudentsInput & { accountId: string };

export class GraduateStudentsUseCase {
    async execute(input: GraduateStudentsUseCaseInput): Promise<GraduateStudentsOutput> {
        const { ids, accountId } = input;

        try {
            const result = await database.$transaction(async (tx) => {
                // 본인 계정의 재학생만 조회
                const students = await tx.student.findMany({
                    where: {
                        id: { in: ids.map((id) => BigInt(id)) },
                        graduatedAt: null, // 재학생만
                        deletedAt: null,
                        group: {
                            accountId: BigInt(accountId),
                        },
                    },
                    include: { group: true },
                });

                // 졸업 처리
                const now = getNowKST();
                const graduatedStudents: GraduatedStudent[] = [];

                for (const student of students) {
                    await tx.student.update({
                        where: { id: student.id },
                        data: { graduatedAt: now },
                    });
                    graduatedStudents.push({
                        id: String(student.id),
                        societyName: student.societyName,
                        graduatedAt: now.toISOString(),
                    });
                }

                return {
                    success: true,
                    graduatedCount: graduatedStudents.length,
                    students: graduatedStudents,
                };
            });

            // GA4 이벤트: 졸업 처리 완료
            if (result.graduatedCount > 0) {
                await ga4.trackStudentGraduated(accountId, result.graduatedCount);
            }

            return result;
        } catch (e) {
            if (e instanceof TRPCError) {
                throw e;
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
