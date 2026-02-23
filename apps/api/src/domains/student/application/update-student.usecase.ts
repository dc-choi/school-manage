/**
 * Update Student UseCase
 *
 * 학생 정보 수정
 */
import type { UpdateStudentInput, UpdateStudentOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class UpdateStudentUseCase {
    async execute(input: UpdateStudentInput): Promise<UpdateStudentOutput> {
        try {
            const student = await database.$transaction(async (tx) => {
                const updated = await tx.student.update({
                    where: {
                        id: BigInt(input.id),
                    },
                    data: {
                        societyName: input.societyName,
                        catholicName: input.catholicName,
                        gender: input.gender,
                        age: input.age ? BigInt(input.age) : null,
                        contact: input.contact ? BigInt(input.contact) : null,
                        description: input.description,
                        groupId: BigInt(input.groupId),
                        baptizedAt: input.baptizedAt,
                        updatedAt: getNowKST(),
                    },
                });
                await createStudentSnapshot(tx, {
                    studentId: updated.id,
                    societyName: updated.societyName,
                    catholicName: updated.catholicName,
                    gender: updated.gender,
                    groupId: updated.groupId,
                });
                return updated;
            });

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
