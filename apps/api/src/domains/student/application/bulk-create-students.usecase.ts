/**
 * Bulk Create Students UseCase
 *
 * 엑셀 Import를 통한 학생 일괄 등록 (로드맵 2단계)
 */
import type { BulkCreateStudentsInput, BulkCreateStudentsOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { assertGroupIdsOwnership } from '~/global/utils/ownership.js';
import { database } from '~/infrastructure/database/database.js';

export class BulkCreateStudentsUseCase {
    async execute(input: BulkCreateStudentsInput, organizationId: string): Promise<BulkCreateStudentsOutput> {
        try {
            const totalCount = input.students.length;

            const now = getNowKST();
            const currentYear = new Date().getFullYear();

            // 권한 검증: 모든 groupIds가 해당 조직 소속인지 확인
            const allGroupIds = [...new Set(input.students.flatMap((s) => s.groupIds))];
            if (allGroupIds.length > 0) {
                await assertGroupIdsOwnership(allGroupIds, organizationId);
            }

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
                            organizationId: BigInt(organizationId),
                            baptizedAt: student.baptizedAt,
                            createdAt: now,
                        },
                    });

                    // StudentGroup junction records 생성
                    for (const gId of student.groupIds) {
                        await tx.studentGroup.create({
                            data: {
                                studentId: created.id,
                                groupId: BigInt(gId),
                                createdAt: now,
                            },
                        });
                    }

                    await createStudentSnapshot(tx, {
                        studentId: created.id,
                        societyName: created.societyName,
                        catholicName: created.catholicName,
                        gender: created.gender,
                        contact: created.contact,
                        description: created.description,
                        baptizedAt: created.baptizedAt,
                        groupId: student.groupIds.length > 0 ? BigInt(student.groupIds[0]) : null,
                    });

                    if (student.registered === true) {
                        await tx.registration.create({
                            data: {
                                studentId: created.id,
                                year: currentYear,
                                registeredAt: now,
                                createdAt: now,
                                updatedAt: now,
                            },
                        });
                    }
                }
            });

            return {
                successCount: totalCount,
                totalCount,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkCreateStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 일괄 등록에 실패했습니다.',
            });
        }
    }
}
