/**
 * Bulk Cancel Registration UseCase
 *
 * 학생 일괄 등록 취소 — 소프트 삭제 (로드맵 2단계 — 등록 관리)
 */
import type { BulkCancelRegistrationInput, BulkCancelRegistrationOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class BulkCancelRegistrationUseCase {
    async execute(input: BulkCancelRegistrationInput, organizationId: string): Promise<BulkCancelRegistrationOutput> {
        try {
            const ids = input.ids.map((id) => BigInt(id));
            const year = input.year ?? new Date().getFullYear();

            // 해당 조직 소유 그룹 조회 (권한 스코프)
            const groups = await database.group.findMany({
                where: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
                select: { id: true },
            });
            const groupIds = groups.map((g) => g.id);

            const now = getNowKST();

            // 소프트 삭제: 해당 조직 소속 학생의 등록 레코드만 취소
            const result = await database.registration.updateMany({
                where: {
                    studentId: { in: ids },
                    year,
                    deletedAt: null,
                    student: {
                        groupId: { in: groupIds },
                    },
                },
                data: {
                    deletedAt: now,
                    updatedAt: now,
                },
            });

            return { cancelledCount: result.count };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkCancelRegistrationUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '등록 취소 처리 중 오류가 발생했습니다.',
            });
        }
    }
}
