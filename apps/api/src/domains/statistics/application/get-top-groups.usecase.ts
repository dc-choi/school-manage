/**
 * Get Top Groups UseCase
 *
 * 그룹별 출석률 순위 TOP N 조회 (스냅샷 기반)
 */
import type { TopGroupsOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/trpc';
import {
    countSundays,
    countSundaysInYear,
    formatDateCompact,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { getBulkGroupSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type TopStatisticsInput = TopStatisticsSchemaInput & { accountId: string };

export class GetTopGroupsUseCase {
    async execute(input: TopStatisticsInput): Promise<TopGroupsOutput> {
        const year = input.year ?? new Date().getFullYear();
        const { month, week } = input;
        const limit = input.limit ?? 5;
        const accountId = BigInt(input.accountId);

        // 1. 날짜 범위 계산
        const { startDateStr, endDateStr, totalDays } = this.getDateRange(year, month, week);

        if (totalDays === 0) {
            return { year, groups: [] };
        }

        // 2. 계정 소속 그룹 조회 (deletedAt 필터 없이 전체)
        const groups = await database.group.findMany({
            where: { accountId },
            select: { id: true, name: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { year, groups: [] };
        }

        // 3. 기간 내 출석 데이터 조회 (attendance.groupId 기반)
        const attendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                groupId: { in: groupIds },
                date: { gte: startDateStr, lte: endDateStr },
            },
            select: { studentId: true, groupId: true, content: true },
        });

        // 4. groupId별 그룹핑
        const grouped = new Map<bigint, { students: Set<bigint>; presentCount: number }>();
        for (const att of attendances) {
            if (!att.groupId) continue;
            let data = grouped.get(att.groupId);
            if (!data) {
                data = { students: new Set(), presentCount: 0 };
                grouped.set(att.groupId, data);
            }
            data.students.add(att.studentId);
            if (att.content && ['◎', '○', '△'].includes(att.content)) {
                data.presentCount++;
            }
        }

        // 5. 그룹 이름 스냅샷 조회
        const allGroupIds = [...grouped.keys()];
        const referenceDate = new Date(year, 11, 31);
        const groupSnapshots = await getBulkGroupSnapshots(allGroupIds, referenceDate);

        // 6. 출석률 계산 및 정렬
        const groupRates = allGroupIds
            .map((groupId) => {
                const data = grouped.get(groupId)!;
                const totalStudents = data.students.size;
                const expected = totalStudents * totalDays;
                const rate = expected > 0 ? (data.presentCount / expected) * 100 : 0;

                const snapshot = groupSnapshots.get(groupId);
                const group = groups.find((g) => g.id === groupId);
                const groupName = snapshot?.name ?? group?.name ?? '삭제된 학년';

                return {
                    groupId: String(groupId),
                    groupName,
                    attendanceRate: roundToDecimal(rate, 1),
                };
            })
            .sort((a, b) => b.attendanceRate - a.attendanceRate);

        return {
            year,
            groups: groupRates.slice(0, limit),
        };
    }

    /**
     * 날짜 범위 계산
     */
    private getDateRange(
        year: number,
        month?: number,
        week?: number
    ): { startDateStr: string; endDateStr: string; totalDays: number } {
        if (month && week) {
            const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        if (month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return {
            startDateStr: formatDateCompact(startDate),
            endDateStr: formatDateCompact(endDate),
            totalDays: countSundaysInYear(year),
        };
    }
}
