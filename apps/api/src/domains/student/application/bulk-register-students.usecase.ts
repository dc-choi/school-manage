/**
 * Bulk Register Students UseCase
 *
 * 학생 일괄 등록 (로드맵 2단계 — 등록 관리)
 */
import type { BulkRegisterStudentsInput, BulkRegisterStudentsOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class BulkRegisterStudentsUseCase {
    async execute(input: BulkRegisterStudentsInput, organizationId: string): Promise<BulkRegisterStudentsOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));
            const year = input.year ?? new Date().getFullYear();
            const now = getNowKST();

            // 해당 조직 소유 그룹의 학생만 등록
            const groups = await database.group.findMany({
                where: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
                select: { id: true },
            });
            const groupIds = groups.map((g) => g.id);

            // 조직 소속 학생인지 확인
            const validStudents = await database.student.findMany({
                where: {
                    id: { in: ids },
                    groupId: { in: groupIds },
                },
                select: { id: true },
            });
            const validStudentIds = validStudents.map((s) => s.id);

            let registeredCount = 0;

            await database.$transaction(async (tx) => {
                for (const studentId of validStudentIds) {
                    // 기존 등록 레코드 확인 (소프트 삭제된 것 포함)
                    const existing = await tx.registration.findUnique({
                        where: { studentId_year: { studentId, year } },
                    });

                    if (existing) {
                        if (existing.deletedAt !== null) {
                            // 소프트 삭제된 레코드 복구
                            await tx.registration.update({
                                where: { id: existing.id },
                                data: {
                                    deletedAt: null,
                                    registeredAt: now,
                                    updatedAt: now,
                                },
                            });
                            registeredCount++;
                        }
                        // 이미 활성 등록된 경우 건너뜀
                    } else {
                        // 새 등록 레코드 생성
                        await tx.registration.create({
                            data: {
                                studentId,
                                year,
                                registeredAt: now,
                                createdAt: now,
                                updatedAt: now,
                            },
                        });
                        registeredCount++;
                    }
                }
            });

            return { registeredCount };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkRegisterStudentsUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '등록 처리 중 오류가 발생했습니다.',
            });
        }
    }
}
