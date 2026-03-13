/**
 * Bulk Add Students to Group UseCase
 *
 * 그룹에 학생 일괄 추가 (GRADE 그룹이면 기존 GRADE 자동 이동)
 */
import type { BulkAddStudentsToGroupInput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type BulkAddStudentsToGroupUseCaseInput = BulkAddStudentsToGroupInput & { organizationId: string };

export class BulkAddStudentsToGroupUseCase {
    async execute(input: BulkAddStudentsToGroupUseCaseInput): Promise<{ addedCount: number }> {
        const { groupId, studentIds, organizationId } = input;
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

            // 학생들 소유권 검증
            const bigintIds = studentIds.map((id: string) => BigInt(id));
            const students = await database.student.findMany({
                where: { id: { in: bigintIds }, organizationId: orgId, deletedAt: null },
                select: {
                    id: true,
                    societyName: true,
                    catholicName: true,
                    gender: true,
                    contact: true,
                    description: true,
                    baptizedAt: true,
                },
            });
            if (students.length === 0) {
                throw new TRPCError({ code: 'NOT_FOUND', message: '유효한 학생이 없습니다.' });
            }

            let addedCount = 0;

            await database.$transaction(async (tx) => {
                for (const student of students) {
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
                        addedCount++;
                    }

                    // 스냅샷 생성
                    await createStudentSnapshot(tx, {
                        studentId: student.id,
                        societyName: student.societyName,
                        catholicName: student.catholicName,
                        gender: student.gender,
                        contact: student.contact,
                        description: student.description,
                        baptizedAt: student.baptizedAt,
                        groupId: group.type === 'GRADE' ? group.id : null,
                    });
                }
            });

            return { addedCount };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkAddStudentsToGroupUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '그룹에 학생을 일괄 추가하는 데 실패했습니다.',
            });
        }
    }
}
