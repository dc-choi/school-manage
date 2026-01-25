/**
 * Get Group Statistics UseCase
 *
 * 모든 그룹의 주간/월간/연간 출석률 및 평균 출석 인원 조회
 */
import type { GroupStatisticsOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import {
    countSundays,
    formatDateCompact,
    getThisWeekSaturday,
    getThisWeekSunday,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export class GetGroupStatisticsUseCase {
    async execute(input: StatisticsInput): Promise<GroupStatisticsOutput> {
        const year = input.year ?? new Date().getFullYear();
        const { month, week } = input;
        const accountId = BigInt(input.accountId);

        // 1. 계정 소속 그룹 조회
        const groups = await database.group.findMany({
            where: {
                accountId,
                deletedAt: null,
            },
            select: { id: true, name: true },
        });

        // 2. 기간 계산
        const weeklyRange = this.getWeeklyRange(year, month, week);
        const monthlyRange = this.getMonthlyRange(year, month);
        const yearlyRange = this.getYearlyRange(year);

        // 3. 각 그룹별 통계 계산
        const groupStats = await Promise.all(
            groups.map(async (group) => {
                const students = await database.student.findMany({
                    where: {
                        groupId: group.id,
                        deletedAt: null,
                        graduatedAt: null,
                    },
                    select: { id: true },
                });

                const studentIds = students.map((s) => s.id);

                const [weekly, monthly, yearly] = await Promise.all([
                    this.calculatePeriodStats(studentIds, weeklyRange.startDate, weeklyRange.endDate),
                    this.calculatePeriodStats(studentIds, monthlyRange.startDate, monthlyRange.endDate),
                    this.calculatePeriodStats(studentIds, yearlyRange.startDate, yearlyRange.endDate),
                ]);

                return {
                    groupId: String(group.id),
                    groupName: group.name,
                    weekly: {
                        ...weekly,
                        startDate: formatDateCompact(weeklyRange.startDate),
                        endDate: formatDateCompact(weeklyRange.endDate),
                    },
                    monthly: {
                        ...monthly,
                        startDate: formatDateCompact(monthlyRange.startDate),
                        endDate: formatDateCompact(monthlyRange.endDate),
                    },
                    yearly: {
                        ...yearly,
                        startDate: formatDateCompact(yearlyRange.startDate),
                        endDate: formatDateCompact(yearlyRange.endDate),
                    },
                    totalStudents: students.length,
                };
            })
        );

        return {
            year,
            groups: groupStats,
        };
    }

    /**
     * 주간 기간 계산
     */
    private getWeeklyRange(year: number, month?: number, week?: number): DateRange {
        // 월과 주차가 모두 지정된 경우: 해당 월의 N번째 주
        if (month && week) {
            return getWeekRangeInMonth(year, month, week);
        }
        // 기본: 현재 주
        const now = new Date();
        return {
            startDate: getThisWeekSunday(now),
            endDate: getThisWeekSaturday(now),
        };
    }

    /**
     * 월간 기간 계산
     */
    private getMonthlyRange(year: number, month?: number): DateRange {
        // 월이 지정된 경우: 해당 월
        if (month) {
            return {
                startDate: new Date(year, month - 1, 1),
                endDate: new Date(year, month, 0),
            };
        }
        // 기본: 현재 월
        const now = new Date();
        return {
            startDate: new Date(year, now.getMonth(), 1),
            endDate: new Date(year, now.getMonth() + 1, 0),
        };
    }

    /**
     * 연간 기간 계산
     */
    private getYearlyRange(year: number): DateRange {
        return {
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
        };
    }

    /**
     * 기간별 통계 계산
     */
    private async calculatePeriodStats(
        studentIds: bigint[],
        startDate: Date,
        endDate: Date
    ): Promise<{ attendanceRate: number; avgAttendance: number }> {
        const totalStudents = studentIds.length;

        if (totalStudents === 0) {
            return { attendanceRate: 0, avgAttendance: 0 };
        }

        const startDateStr = formatDateCompact(startDate);
        const endDateStr = formatDateCompact(endDate);

        const attendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                studentId: { in: studentIds },
                date: {
                    gte: startDateStr,
                    lte: endDateStr,
                },
                content: { in: ['◎', '○', '△'] },
            },
        });

        const totalDays = countSundays(startDate, endDate);

        if (totalDays === 0) {
            return { attendanceRate: 0, avgAttendance: 0 };
        }

        const expectedAttendances = totalStudents * totalDays;
        const actualAttendances = attendances.length;
        const attendanceRate = (actualAttendances / expectedAttendances) * 100;
        const avgAttendance = actualAttendances / totalDays;

        return {
            attendanceRate: roundToDecimal(attendanceRate, 1),
            avgAttendance: roundToDecimal(avgAttendance, 1),
        };
    }
}
