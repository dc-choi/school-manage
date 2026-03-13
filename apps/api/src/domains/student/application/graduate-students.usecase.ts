/**
 * Graduate Students UseCase
 *
 * 학생 일괄 졸업 처리 (graduatedAt 설정)
 */
import type {
    GraduateStudentsInput,
    GraduateStudentsOutput,
    GraduatedStudent,
    OrganizationType,
    SkippedStudent,
} from '@school/trpc';
import { getMaxGraduationAge } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { ga4 } from '~/infrastructure/analytics/ga4.js';
import { database } from '~/infrastructure/database/database.js';

type GraduateStudentsUseCaseInput = GraduateStudentsInput & { organizationId: string };

export class GraduateStudentsUseCase {
    async execute(input: GraduateStudentsUseCaseInput): Promise<GraduateStudentsOutput> {
        const { ids, organizationId } = input;

        try {
            const result = await database.$transaction(async (tx) => {
                // Organization의 type 조회
                const organization = await tx.organization.findUnique({
                    where: { id: BigInt(organizationId) },
                    select: { type: true },
                });
                const maxAge = getMaxGraduationAge((organization?.type ?? 'MIDDLE_HIGH') as OrganizationType);

                // 본인 조직의 재학생만 조회
                const students = await tx.student.findMany({
                    where: {
                        id: { in: ids.map((id) => BigInt(id)) },
                        graduatedAt: null, // 재학생만
                        deletedAt: null,
                        group: {
                            organizationId: BigInt(organizationId),
                        },
                    },
                    include: { group: true },
                });

                // 나이 기반 졸업 대상 필터링
                const eligible: typeof students = [];
                const skipped: SkippedStudent[] = [];

                if (maxAge !== null) {
                    for (const s of students) {
                        if (s.age !== null && Number(s.age) < maxAge) {
                            skipped.push({
                                id: String(s.id),
                                societyName: s.societyName,
                                reason: `현재 ${s.age}살`,
                            });
                        } else {
                            eligible.push(s);
                        }
                    }
                } else {
                    // YOUNG_ADULT: 전원 졸업 가능
                    eligible.push(...students);
                }

                // graduatedAt 정규화: 나이는 1/1에 올라가므로 졸업일은 전년도 12/31
                // getNowKST()는 내부 UTC가 KST이므로 getUTC*로 추출, Date.UTC로 생성
                const now = getNowKST();
                const year = now.getUTCFullYear();
                const normalizedGraduatedAt = new Date(Date.UTC(year - 1, 11, 31, 0, 0, 0));

                // 졸업 처리
                const graduatedStudents: GraduatedStudent[] = [];

                for (const student of eligible) {
                    await tx.student.update({
                        where: { id: student.id },
                        data: { graduatedAt: normalizedGraduatedAt },
                    });
                    await createStudentSnapshot(tx, {
                        studentId: student.id,
                        societyName: student.societyName,
                        catholicName: student.catholicName,
                        gender: student.gender,
                        contact: student.contact,
                        description: student.description,
                        baptizedAt: student.baptizedAt,
                        groupId: student.groupId,
                    });
                    graduatedStudents.push({
                        id: String(student.id),
                        societyName: student.societyName,
                        graduatedAt: normalizedGraduatedAt.toISOString(),
                    });
                }

                return {
                    success: true,
                    graduatedCount: graduatedStudents.length,
                    students: graduatedStudents,
                    skipped,
                };
            });

            // GA4 이벤트: 졸업 처리 완료
            if (result.graduatedCount > 0) {
                await ga4.trackStudentGraduated(organizationId, result.graduatedCount);
            }

            return result;
        } catch (e) {
            if (e instanceof TRPCError) {
                throw e;
            }
            console.error('[GraduateStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '졸업 처리에 실패했습니다.',
            });
        }
    }
}
