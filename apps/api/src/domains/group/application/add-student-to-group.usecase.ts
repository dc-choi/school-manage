/**
 * Add Student to Group UseCase
 *
 * 그룹에 학생 추가 (GRADE 그룹이면 기존 GRADE 자동 이동)
 */
import type { AddStudentToGroupInput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type AddStudentToGroupUseCaseInput = AddStudentToGroupInput & { organizationId: string };

export class AddStudentToGroupUseCase {
    async execute(input: AddStudentToGroupUseCaseInput): Promise<{ success: boolean }> {
        const { groupId, studentId, organizationId } = input;
        const orgId = BigInt(organizationId);

        try {
            // 그룹 소유권 + type 조회
            const group = await database.group.findFirst({
                where: { id: BigInt(groupId), organizationId: orgId, deletedAt: null },
                select: { id: true, type: true },
            });
            if (!group) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다.' });
            }

            // 학생 소유권 검증
            const student = await database.student.findFirst({
                where: { id: BigInt(studentId), organizationId: orgId, deletedAt: null },
                select: {
                    id: true,
                    societyName: true,
                    catholicName: true,
                    gender: true,
                    contact: true,
                    parentContact: true,
                    description: true,
                    baptizedAt: true,
                },
            });
            if (!student) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '학생을 찾을 수 없습니다.' });
            }

            await database.$transaction(async (tx) => {
                // GRADE 그룹이면 기존 GRADE 그룹에서 제거 (자동 이동)
                if (group.type === 'GRADE') {
                    const existingGradeGroups = await tx.studentGroup.findMany({
                        where: {
                            studentId: student.id,
                            group: { type: 'GRADE', deletedAt: null },
                        },
                        select: { id: true },
                    });
                    if (existingGradeGroups.length > 0) {
                        await tx.studentGroup.deleteMany({
                            where: { id: { in: existingGradeGroups.map((sg) => sg.id) } },
                        });
                    }
                }

                // 중복 확인
                const existing = await tx.studentGroup.findFirst({
                    where: { studentId: student.id, groupId: group.id },
                });
                if (!existing) {
                    await tx.studentGroup.create({
                        data: { studentId: student.id, groupId: group.id, createdAt: getNowKST() },
                    });
                }

                // 스냅샷 생성
                await createStudentSnapshot(tx, {
                    studentId: student.id,
                    societyName: student.societyName,
                    catholicName: student.catholicName,
                    gender: student.gender,
                    contact: student.contact,
                    parentContact: student.parentContact,
                    description: student.description,
                    baptizedAt: student.baptizedAt,
                    groupId: group.type === 'GRADE' ? group.id : null,
                });
            });

            return { success: true };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[AddStudentToGroupUseCase]', e);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '그룹에 학생을 추가하는 데 실패했습니다.' });
        }
    }
}
