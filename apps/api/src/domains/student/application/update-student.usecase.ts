/**
 * Update Student UseCase
 *
 * 학생 정보 수정
 */
import type { Gender, UpdateStudentInput, UpdateStudentOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { assertGroupIdsOwnership } from '~/global/utils/ownership.js';
import { database } from '~/infrastructure/database/database.js';

export class UpdateStudentUseCase {
    async execute(input: UpdateStudentInput, organizationId: string): Promise<UpdateStudentOutput> {
        try {
            // 권한 검증: 학생이 해당 조직 소속인지 확인
            const existing = await database.student.findFirst({
                where: { id: BigInt(input.id), organizationId: BigInt(organizationId), deletedAt: null },
                select: { id: true },
            });
            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '학생을 찾을 수 없습니다.',
                });
            }

            // 그룹 소유권 검증 (groupIds 변경 시)
            if (input.groupIds !== undefined) {
                await assertGroupIdsOwnership(input.groupIds, organizationId);
            }

            const { student, studentGroups } = await database.$transaction(async (tx) => {
                // partial update: undefined -> skip, null -> clear, 값 -> set
                const data: Record<string, unknown> = { updatedAt: getNowKST() };
                if (input.societyName !== undefined) data.societyName = input.societyName;
                if (input.catholicName !== undefined) data.catholicName = input.catholicName;
                if (input.gender !== undefined) data.gender = input.gender;
                if (input.age !== undefined) data.age = input.age ? BigInt(input.age) : null;
                if (input.contact !== undefined) data.contact = input.contact?.trim() ? input.contact.trim() : null;
                if (input.parentContact !== undefined)
                    data.parentContact = input.parentContact?.trim() ? input.parentContact.trim() : null;
                if (input.description !== undefined) data.description = input.description;
                if (input.baptizedAt !== undefined) data.baptizedAt = input.baptizedAt;

                const updated = await tx.student.update({
                    where: { id: BigInt(input.id), organizationId: BigInt(organizationId) },
                    data,
                });

                // groupIds가 변경된 경우: StudentGroup junction records 재생성
                if (input.groupIds !== undefined) {
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

                // StudentGroup + Group 이름/타입 조회
                const sgs = await tx.studentGroup.findMany({
                    where: { studentId: updated.id },
                    include: { group: { select: { id: true, name: true, type: true } } },
                });

                const gradeGroup = sgs.find((sg) => sg.group.type === 'GRADE');

                await createStudentSnapshot(tx, {
                    studentId: updated.id,
                    societyName: updated.societyName,
                    catholicName: updated.catholicName,
                    gender: updated.gender,
                    contact: updated.contact,
                    parentContact: updated.parentContact,
                    description: updated.description,
                    baptizedAt: updated.baptizedAt,
                    groupId: gradeGroup?.group.id ?? null,
                });

                return { student: updated, studentGroups: sgs };
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                gender: (student.gender ?? undefined) as Gender | undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact ?? undefined,
                parentContact: student.parentContact ?? undefined,
                description: student.description ?? undefined,
                groups: studentGroups.map((sg) => ({
                    id: String(sg.group.id),
                    name: sg.group.name,
                    type: sg.group.type,
                })),
                baptizedAt: student.baptizedAt ?? undefined,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[UpdateStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 수정에 실패했습니다.',
            });
        }
    }
}
