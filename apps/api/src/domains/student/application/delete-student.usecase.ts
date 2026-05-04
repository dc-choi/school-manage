/**
 * Delete Student UseCase
 *
 * 학생 삭제 (소프트 삭제)
 */
import type { DeleteStudentInput, DeleteStudentOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class DeleteStudentUseCase {
    async execute(input: DeleteStudentInput, organizationId: string): Promise<DeleteStudentOutput> {
        try {
            // 권한 검증: organizationId를 where절에 포함하여 타 조직 접근 차단
            const existing = await database.student.findFirst({
                where: {
                    id: BigInt(input.id),
                    organizationId: BigInt(organizationId),
                },
            });

            if (!existing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: '학생을 찾을 수 없습니다.',
                });
            }

            const student = await database.student.update({
                where: {
                    id: BigInt(input.id),
                    organizationId: BigInt(organizationId),
                },
                data: {
                    deletedAt: getNowKST(),
                },
                include: {
                    studentGroups: {
                        include: {
                            group: { select: { id: true, name: true, type: true } },
                        },
                    },
                },
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact ?? undefined,
                parentContact: student.parentContact ?? undefined,
                description: student.description ?? undefined,
                groups: student.studentGroups.map((sg) => ({
                    id: String(sg.group.id),
                    name: sg.group.name,
                    type: sg.group.type,
                })),
                baptizedAt: student.baptizedAt ?? undefined,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[DeleteStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 삭제에 실패했습니다.',
            });
        }
    }
}
