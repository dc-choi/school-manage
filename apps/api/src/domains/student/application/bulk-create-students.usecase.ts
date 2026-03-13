/**
 * Bulk Create Students UseCase
 *
 * 엑셀 Import를 통한 학생 일괄 등록 (로드맵 2단계)
 */
import type { BulkCreateStudentsInput, BulkCreateStudentsOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class BulkCreateStudentsUseCase {
    async execute(input: BulkCreateStudentsInput, organizationId: string): Promise<BulkCreateStudentsOutput> {
        try {
            const totalCount = input.students.length;

            const now = getNowKST();
            const currentYear = new Date().getFullYear();

            // 해당 조직 소유 그룹 조회 (권한 스코프)
            const groups = await database.group.findMany({
                where: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
                select: { id: true },
            });
            const validGroupIds = new Set(groups.map((g) => g.id));

            // 입력된 groupIds가 모두 조직 소속인지 검증
            for (const student of input.students) {
                for (const gId of student.groupIds) {
                    if (!validGroupIds.has(BigInt(gId))) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: '접근 권한이 없는 그룹입니다.',
                        });
                    }
                }
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
                            groupId: BigInt(student.groupIds[0]),
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
                        groupId: created.groupId,
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
            console.error('[BulkCreateStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 일괄 등록에 실패했습니다.',
            });
        }
    }
}
