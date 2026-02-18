/**
 * Get Feast Day List UseCase
 *
 * 지정 월에 축일(baptizedAt)이 있는 재학생 목록 조회
 */
import type { FeastDayListOutput, FeastDayListInput as FeastDayListSchemaInput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type FeastDayListInput = FeastDayListSchemaInput & { accountId: string };

const BAPTIZED_AT_PATTERN = /^\d{2}\/\d{2}$/;

export class GetFeastDayListUseCase {
    async execute(input: FeastDayListInput): Promise<FeastDayListOutput> {
        // 1. accountId 소속 그룹 조회 (deletedAt=null)
        const groups = await database.group.findMany({
            where: {
                accountId: BigInt(input.accountId),
                deletedAt: null,
            },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { students: [] };
        }

        // 2. 해당 그룹들의 재학생 조회 (deletedAt=null, graduatedAt=null, baptizedAt not null)
        const rows = await database.student.findMany({
            where: {
                groupId: { in: groupIds },
                deletedAt: null,
                graduatedAt: null,
                baptizedAt: { not: null },
            },
            include: {
                group: {
                    select: { name: true },
                },
            },
        });

        // 3. baptizedAt의 월 부분이 요청 month와 일치하는 학생 필터링
        const monthStr = String(input.month).padStart(2, '0');
        const filtered = rows.filter((row) => {
            if (!row.baptizedAt || !BAPTIZED_AT_PATTERN.test(row.baptizedAt)) {
                return false;
            }
            return row.baptizedAt.substring(0, 2) === monthStr;
        });

        // 4. DD 부분 오름차순 정렬
        filtered.sort((a, b) => {
            const dayA = a.baptizedAt!.substring(3, 5);
            const dayB = b.baptizedAt!.substring(3, 5);
            return dayA.localeCompare(dayB);
        });

        // 5. FeastDayListOutput 반환
        return {
            students: filtered.map((row) => ({
                societyName: row.societyName,
                catholicName: row.catholicName ?? '',
                baptizedAt: row.baptizedAt!,
                groupName: row.group?.name ?? '',
            })),
        };
    }
}
