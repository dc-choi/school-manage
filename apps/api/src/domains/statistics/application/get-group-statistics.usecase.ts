/**
 * Get Group Statistics UseCase
 *
 * 모든 그룹의 주간/월간/연간 출석률 및 평균 출석 인원 조회 (스냅샷 기반)
 */
import type { GroupStatisticsOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import {
    clampToToday,
    countSundays,
    formatDateCompact,
    getGraduationCutoff,
    getThisWeekSaturday,
    getThisWeekSunday,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { getBulkGroupSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface PeriodGroupData {
    grouped: Map<bigint, { presentCount: number }>;
    totalDays: number;
    startDateStr: string;
    endDateStr: string;
}

export class GetGroupStatisticsUseCase {
    async execute(input: StatisticsInput): Promise<GroupStatisticsOutput> {
        const year = input.year ?? new Date().getFullYear();
        const { month, week } = input;
        const accountId = BigInt(input.accountId);

        // 1. 계정 소속 그룹 조회 (deletedAt 필터 없이 전체)
        const groups = await database.group.findMany({
            where: { accountId },
            select: { id: true, name: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { year, groups: [] };
        }

        // 2. 그룹별 학생 수 조회 (조회 기간 시작일 기준 졸업 필터 적용)
        const graduationCutoff = getGraduationCutoff(year, month, week);
        const students = await database.student.findMany({
            where: {
                groupId: { in: groupIds },
                deletedAt: null,
                OR: [{ graduatedAt: null }, { graduatedAt: { gte: graduationCutoff } }],
            },
            select: { id: true, groupId: true },
        });

        const studentsByGroup = new Map<bigint, Set<bigint>>();
        for (const s of students) {
            let set = studentsByGroup.get(s.groupId);
            if (!set) {
                set = new Set();
                studentsByGroup.set(s.groupId, set);
            }
            set.add(s.id);
        }

        // 3. 그룹 이름 스냅샷 조회 (연도 말 기준)
        const referenceDate = new Date(year, 11, 31);
        const groupSnapshots = await getBulkGroupSnapshots(groupIds, referenceDate);

        // 4. 기간 계산
        const weeklyRange = this.getWeeklyRange(year, month, week);
        const monthlyRange = this.getMonthlyRange(year, month);
        const yearlyRange = this.getYearlyRange(year);

        // 5. 각 기간별 attendance 조회 및 그룹핑
        const [weeklyData, monthlyData, yearlyData] = await Promise.all([
            this.fetchPeriodData(groupIds, weeklyRange),
            this.fetchPeriodData(groupIds, monthlyRange),
            this.fetchPeriodData(groupIds, yearlyRange),
        ]);

        // 6. 학생이 있는 그룹 기준으로 통계 조합
        const groupStats = [...studentsByGroup.keys()].map((groupId) => {
            const snapshot = groupSnapshots.get(groupId);
            const group = groups.find((g) => g.id === groupId);
            const groupName = snapshot?.name ?? group?.name ?? '삭제된 학년';
            const totalStudents = studentsByGroup.get(groupId)?.size ?? 0;

            const calcStats = (data: PeriodGroupData) => {
                const groupData = data.grouped.get(groupId);
                if (!groupData || data.totalDays === 0 || totalStudents === 0) {
                    return { attendanceRate: 0, avgAttendance: 0 };
                }
                const expected = totalStudents * data.totalDays;
                const rate = expected > 0 ? (groupData.presentCount / expected) * 100 : 0;
                const avg = data.totalDays > 0 ? groupData.presentCount / data.totalDays : 0;
                return {
                    attendanceRate: roundToDecimal(rate, 1),
                    avgAttendance: roundToDecimal(avg, 1),
                };
            };

            return {
                groupId: String(groupId),
                groupName,
                weekly: {
                    ...calcStats(weeklyData),
                    startDate: weeklyData.startDateStr,
                    endDate: weeklyData.endDateStr,
                },
                monthly: {
                    ...calcStats(monthlyData),
                    startDate: monthlyData.startDateStr,
                    endDate: monthlyData.endDateStr,
                },
                yearly: {
                    ...calcStats(yearlyData),
                    startDate: yearlyData.startDateStr,
                    endDate: yearlyData.endDateStr,
                },
                totalStudents,
            };
        });

        return { year, groups: groupStats };
    }

    /**
     * 기간별 attendance 조회 + groupId별 그룹핑
     */
    private async fetchPeriodData(groupIds: bigint[], range: DateRange): Promise<PeriodGroupData> {
        const startDateStr = formatDateCompact(range.startDate);
        const endDateStr = formatDateCompact(range.endDate);
        const totalDays = countSundays(range.startDate, range.endDate);

        const attendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                groupId: { in: groupIds },
                date: { gte: startDateStr, lte: endDateStr },
            },
            select: { groupId: true, content: true },
        });

        const grouped = new Map<bigint, { presentCount: number }>();
        for (const att of attendances) {
            if (!att.groupId) continue;
            let data = grouped.get(att.groupId);
            if (!data) {
                data = { presentCount: 0 };
                grouped.set(att.groupId, data);
            }
            if (att.content && ['◎', '○', '△'].includes(att.content)) {
                data.presentCount++;
            }
        }

        return { grouped, totalDays, startDateStr, endDateStr };
    }

    private getWeeklyRange(year: number, month?: number, week?: number): DateRange {
        if (month && week) {
            return getWeekRangeInMonth(year, month, week);
        }
        const now = new Date();
        return {
            startDate: getThisWeekSunday(now),
            endDate: getThisWeekSaturday(now),
        };
    }

    private getMonthlyRange(year: number, month?: number): DateRange {
        if (month) {
            return {
                startDate: new Date(year, month - 1, 1),
                endDate: clampToToday(new Date(year, month, 0)),
            };
        }
        const now = new Date();
        return {
            startDate: new Date(year, now.getMonth(), 1),
            endDate: clampToToday(new Date(year, now.getMonth() + 1, 0)),
        };
    }

    private getYearlyRange(year: number): DateRange {
        return {
            startDate: new Date(year, 0, 1),
            endDate: clampToToday(new Date(year, 11, 31)),
        };
    }
}
