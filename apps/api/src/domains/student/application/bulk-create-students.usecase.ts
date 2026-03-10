/**
 * Bulk Create Students UseCase
 *
 * 엑셀 Import를 통한 학생 일괄 등록 (로드맵 2단계)
 */
import type { BulkCreateStudentsInput, BulkCreateStudentsOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class BulkCreateStudentsUseCase {
    async execute(input: BulkCreateStudentsInput): Promise<BulkCreateStudentsOutput> {
        try {
            const totalCount = input.students.length;

            await database.$transaction(async (tx) => {
                for (const student of input.students) {
                    const created = await tx.student.create({
                        data: {
                            societyName: student.societyName,
                            catholicName: student.catholicName,
                            gender: student.gender,
                            age: student.age ? BigInt(student.age) : null,
                            contact: student.contact ? BigInt(student.contact) : null,
                            description: student.description,
                            groupId: BigInt(student.groupId),
                            baptizedAt: student.baptizedAt,
                            createdAt: getNowKST(),
                        },
                    });
                    await createStudentSnapshot(tx, {
                        studentId: created.id,
                        societyName: created.societyName,
                        catholicName: created.catholicName,
                        gender: created.gender,
                        contact: created.contact,
                        description: created.description,
                        baptizedAt: created.baptizedAt,
                        groupId: created.groupId,
                    });
                }
            });

            return {
                successCount: totalCount,
                totalCount,
            };
        } catch (e) {
            console.error('[BulkCreateStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 일괄 등록에 실패했습니다.',
            });
        }
    }
}
