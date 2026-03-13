/**
 * Create Student UseCase
 *
 * 새 학생 생성
 */
import type { CreateStudentInput, CreateStudentOutput, Gender } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class CreateStudentUseCase {
    async execute(input: CreateStudentInput, organizationId: string): Promise<CreateStudentOutput> {
        try {
            // 측정 인프라: 조직의 첫 학생인지 확인
            const existingStudentCount = await database.student.count({
                where: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
            });
            const isFirstStudent = existingStudentCount === 0;

            // 측정 인프라: 조직 생성 후 경과일 계산
            let daysSinceCreation: number | undefined;
            if (isFirstStudent) {
                const org = await database.organization.findUnique({
                    where: { id: BigInt(organizationId) },
                    select: { createdAt: true },
                });
                if (org?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - org.createdAt.getTime();
                    daysSinceCreation = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            // 권한 검증: groupIds가 해당 조직 소속인지 확인
            const orgId = BigInt(organizationId);
            const validGroupCount = await database.group.count({
                where: { id: { in: input.groupIds.map((gId) => BigInt(gId)) }, organizationId: orgId, deletedAt: null },
            });
            if (validGroupCount !== input.groupIds.length) {
                throw new TRPCError({ code: 'FORBIDDEN', message: '해당 학년에 대한 접근 권한이 없습니다.' });
            }

            const { student, studentGroups } = await database.$transaction(async (tx) => {
                const created = await tx.student.create({
                    data: {
                        societyName: input.societyName,
                        catholicName: input.catholicName,
                        gender: input.gender,
                        age: input.age ? BigInt(input.age) : null,
                        contact: input.contact ? BigInt(input.contact) : null,
                        description: input.description,
                        organizationId: BigInt(organizationId),
                        baptizedAt: input.baptizedAt,
                        createdAt: getNowKST(),
                    },
                });

                // StudentGroup junction records 생성
                for (const gId of input.groupIds) {
                    await tx.studentGroup.create({
                        data: {
                            studentId: created.id,
                            groupId: BigInt(gId),
                            createdAt: getNowKST(),
                        },
                    });
                }

                // 생성된 StudentGroup + Group 이름/타입 조회
                const sgs = await tx.studentGroup.findMany({
                    where: { studentId: created.id },
                    include: { group: { select: { id: true, name: true, type: true } } },
                });

                const gradeGroup = sgs.find((sg) => sg.group.type === 'GRADE');

                await createStudentSnapshot(tx, {
                    studentId: created.id,
                    societyName: created.societyName,
                    catholicName: created.catholicName,
                    gender: created.gender,
                    contact: created.contact,
                    description: created.description,
                    baptizedAt: created.baptizedAt,
                    groupId: gradeGroup?.group.id ?? null,
                });

                return { student: created, studentGroups: sgs };
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                gender: (student.gender ?? undefined) as Gender | undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact != null ? String(student.contact) : undefined,
                description: student.description ?? undefined,
                groups: studentGroups.map((sg) => ({
                    id: String(sg.group.id),
                    name: sg.group.name,
                    type: sg.group.type,
                })),
                baptizedAt: student.baptizedAt ?? undefined,
                // 측정 인프라용 필드
                isFirstStudent,
                daysSinceCreation,
            };
        } catch (e) {
            console.error('[CreateStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 등록에 실패했습니다.',
            });
        }
    }
}
