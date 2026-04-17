/**
 * Get Group Statistics UseCase
 *
 * 모든 그룹의 주간/월간/연간 출석률 및 평균 출석 인원 조회 (스냅샷 기반)
 */
import type { GroupStatisticsOutput, StatisticsInput as StatisticsSchemaInput } from '@school/shared';
import {
    clampToToday,
    countSundays,
    formatDateCompact,
    getGraduationCutoff,
    getNowKST,
    getThisWeekSaturday,
    getThisWeekSunday,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { getBulkGroupSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { PRESENT_COUNT_SQL } from '~/domains/statistics/statistics.helper.js';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { organizationId: string };

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
        const year = input.year ?? getNowKST().getFullYear();
        const { month, week } = input;
        const organizationId = BigInt(input.organizationId);

        // 1. 학년(GRADE) 그룹만 조회 (부서는 통계 제외)
        const groups = await database.group.findMany({
            where: { organizationId, type: 'GRADE' },
            select: { id: true, name: true, type: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { year, groups: [] };
        }

        // 2. 그룹별 학생 수 조회 (조회 기간 시작일 기준 졸업 필터 적용, StudentGroup 기반)
        const graduationCutoff = getGraduationCutoff(year, month, week);
        const studentGroupRecords = await database.studentGroup.findMany({
            where: {
                groupId: { in: groupIds },
                student: {
                    deletedAt: null,
                    OR: [{ graduatedAt: null }, { graduatedAt: { gte: graduationCutoff } }],
                },
            },
            select: { studentId: true, groupId: true },
        });

        const studentsByGroup = new Map<bigint, Set<bigint>>();
        for (const sg of studentGroupRecords) {
            let set = studentsByGroup.get(sg.groupId);
            if (!set) {
                set = new Set();
                studentsByGroup.set(sg.groupId, set);
            }
            set.add(sg.studentId);
        }

        // 2b. 그룹별 등록 학생 수 조회 (해당 연도)
        const studentIds = [...new Set(studentGroupRecords.map((sg) => sg.studentId))];
        const registrations =
            studentIds.length > 0
                ? await database.registration.findMany({
                      where: { studentId: { in: studentIds }, year, deletedAt: null },
                      select: { studentId: true },
                  })
                : [];
        const registeredStudentIds = new Set(registrations.map((r) => r.studentId));
        const registeredByGroup = new Map<bigint, number>();
        for (const sg of studentGroupRecords) {
            if (registeredStudentIds.has(sg.studentId)) {
                registeredByGroup.set(sg.groupId, (registeredByGroup.get(sg.groupId) ?? 0) + 1);
            }
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
                groupType: group?.type ?? 'GRADE',
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
                registeredStudents: registeredByGroup.get(groupId) ?? 0,
            };
        });

        return { year, groups: groupStats };
    }

    /**
     * 기간별 출석 인정(◎/○/△) 수 조회 — DB 레벨 GROUP BY group_id
     */
    private async fetchPeriodData(groupIds: bigint[], range: DateRange): Promise<PeriodGroupData> {
        const startDateStr = formatDateCompact(range.startDate);
        const endDateStr = formatDateCompact(range.endDate);
        const totalDays = countSundays(range.startDate, range.endDate);

        const presentRows = await database.$kysely
            .selectFrom('attendance as a')
            .select('a.groupId')
            .select(PRESENT_COUNT_SQL.as('presentCount'))
            .where('a.deleteAt', 'is', null)
            .where(
                'a.groupId',
                'in',
                groupIds.map((id) => Number(id))
            )
            .where('a.date', '>=', startDateStr)
            .where('a.date', '<=', endDateStr)
            .groupBy('a.groupId')
            .execute();

        const grouped = new Map<bigint, { presentCount: number }>();
        for (const row of presentRows) {
            if (row.groupId === null) continue;
            grouped.set(BigInt(row.groupId), { presentCount: Number(row.presentCount ?? 0) });
        }

        return { grouped, totalDays, startDateStr, endDateStr };
    }

    private getWeeklyRange(year: number, month?: number, week?: number): DateRange {
        if (month && week) {
            return getWeekRangeInMonth(year, month, week);
        }
        const now = getNowKST();
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
        const now = getNowKST();
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
