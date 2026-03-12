/**
 * Update Student UseCase
 *
 * 학생 정보 수정
 */
import type { Gender, UpdateStudentInput, UpdateStudentOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class UpdateStudentUseCase {
    async execute(input: UpdateStudentInput, organizationId: string): Promise<UpdateStudentOutput> {
        try {
            const { student, studentGroups } = await database.$transaction(async (tx) => {
                // 권한 검증: 학생이 해당 조직 소속인지 확인
                const orgId = BigInt(organizationId);
                const existing = await tx.studentGroup.findFirst({
                    where: {
                        studentId: BigInt(input.id),
                        group: { organizationId: orgId },
                    },
                });
                if (!existing) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: '해당 학생에 대한 접근 권한이 없습니다.',
                    });
                }

                // partial update: undefined -> skip, null -> clear, 값 -> set
                const data: Record<string, unknown> = { updatedAt: getNowKST() };
                if (input.societyName !== undefined) data.societyName = input.societyName;
                if (input.catholicName !== undefined) data.catholicName = input.catholicName;
                if (input.gender !== undefined) data.gender = input.gender;
                if (input.age !== undefined) data.age = input.age ? BigInt(input.age) : null;
                if (input.contact !== undefined) data.contact = input.contact ? BigInt(input.contact) : null;
                if (input.description !== undefined) data.description = input.description;
                if (input.groupIds !== undefined) data.groupId = BigInt(input.groupIds[0]);
                if (input.baptizedAt !== undefined) data.baptizedAt = input.baptizedAt;

                const updated = await tx.student.update({
                    where: { id: BigInt(input.id) },
                    data,
                });

                // groupIds가 변경된 경우: 새 그룹 소유권 검증 + StudentGroup junction records 재생성
                if (input.groupIds !== undefined) {
                    const validGroupCount = await tx.group.count({
                        where: {
                            id: { in: input.groupIds.map((gId) => BigInt(gId)) },
                            organizationId: orgId,
                            deletedAt: null,
                        },
                    });
                    if (validGroupCount !== input.groupIds.length) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: '해당 학년에 대한 접근 권한이 없습니다.',
                        });
                    }

                    await tx.studentGroup.deleteMany({
                        where: { studentId: BigInt(input.id) },
                    });
                    for (const gId of input.groupIds) {
                        await tx.studentGroup.create({
                            data: {
                                studentId: BigInt(input.id),
                                groupId: BigInt(gId),
                                createdAt: getNowKST(),
                            },
                        });
                    }
                }

                await createStudentSnapshot(tx, {
                    studentId: updated.id,
                    societyName: updated.societyName,
                    catholicName: updated.catholicName,
                    gender: updated.gender,
                    contact: updated.contact,
                    description: updated.description,
                    baptizedAt: updated.baptizedAt,
                    groupId: updated.groupId,
                });

                // StudentGroup + Group 이름 조회
                const sgs = await tx.studentGroup.findMany({
                    where: { studentId: updated.id },
                    include: { group: { select: { id: true, name: true } } },
                });

                return { student: updated, studentGroups: sgs };
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
                })),
                baptizedAt: student.baptizedAt ?? undefined,
            };
        } catch (e) {
            console.error('[UpdateStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 수정에 실패했습니다.',
            });
        }
    }
}
