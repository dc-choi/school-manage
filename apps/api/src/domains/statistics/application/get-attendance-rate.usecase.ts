/**
 * Get Attendance Rate UseCase
 *
 * 주간/월간/연간 출석률 조회 (스냅샷 기반)
 */
import type { AttendanceRateOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import {
    clampToToday,
    countSundays,
    formatDateCompact,
    getNowKST,
    getThisWeekSaturday,
    getThisWeekSunday,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

type Period = 'weekly' | 'monthly' | 'yearly';

export class GetAttendanceRateUseCase {
    async execute(input: StatisticsInput, period: Period): Promise<AttendanceRateOutput> {
        const year = input.year ?? getNowKST().getFullYear();
        const { month, week } = input;
        const accountId = BigInt(input.accountId);

        // 1. 기간 계산
        const { startDate, endDate } = this.calculateDateRange(year, period, month, week);
        const startDateStr = formatDateCompact(startDate);
        const endDateStr = formatDateCompact(endDate);

        // 2. 계정 소속 그룹 ID 조회 (deletedAt 필터 없이 전체)
        const groups = await database.group.findMany({
            where: { accountId },
            select: { id: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return {
                year,
                period,
                startDate: startDateStr,
                endDate: endDateStr,
                attendanceRate: 0,
                avgAttendance: 0,
                totalStudents: 0,
            };
        }

        // 3. 그룹에 속한 전체 학생 수 조회 (조회 기간 시작일 기준 졸업 필터 적용)
        const graduationCutoff = startDate;
        const totalStudents = await database.student.count({
            where: {
                groupId: { in: groupIds },
                deletedAt: null,
                OR: [{ graduatedAt: null }, { graduatedAt: { gte: graduationCutoff } }],
            },
        });

        if (totalStudents === 0) {
            return {
                year,
                period,
                startDate: startDateStr,
                endDate: endDateStr,
                attendanceRate: 0,
                avgAttendance: 0,
                totalStudents: 0,
            };
        }

        // 4. 기간 내 출석 데이터 조회 (attendance.groupId 기반)
        const allAttendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                groupId: { in: groupIds },
                date: {
                    gte: startDateStr,
                    lte: endDateStr,
                },
            },
            select: { content: true },
        });

        // 5. 출석 일수 계산 (해당 기간 내 일요일 수)
        const totalDays = countSundays(startDate, endDate);

        if (totalDays === 0) {
            return {
                year,
                period,
                startDate: startDateStr,
                endDate: endDateStr,
                attendanceRate: 0,
                avgAttendance: 0,
                totalStudents,
            };
        }

        // 6. 실제 출석 수 (◎, ○, △)
        const actualAttendances = allAttendances.filter((a) => a.content && ['◎', '○', '△'].includes(a.content)).length;

        // 7. 출석률 계산
        const expectedAttendances = totalStudents * totalDays;
        const attendanceRate = (actualAttendances / expectedAttendances) * 100;

        // 8. 평균 출석 인원
        const avgAttendance = actualAttendances / totalDays;

        return {
            year,
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            attendanceRate: roundToDecimal(attendanceRate, 1),
            avgAttendance: roundToDecimal(avgAttendance, 1),
            totalStudents,
        };
    }

    /**
     * 기간 계산
     */
    private calculateDateRange(
        year: number,
        period: Period,
        month?: number,
        week?: number
    ): { startDate: Date; endDate: Date } {
        const now = getNowKST();

        if (period === 'weekly') {
            if (month && week) {
                return getWeekRangeInMonth(year, month, week);
            }
            return {
                startDate: getThisWeekSunday(now),
                endDate: getThisWeekSaturday(now),
            };
        }

        if (period === 'monthly') {
            if (month) {
                return {
                    startDate: new Date(year, month - 1, 1),
                    endDate: clampToToday(new Date(year, month, 0)),
                };
            }
            const startDate = new Date(year, now.getMonth(), 1);
            const endDate = clampToToday(new Date(year, now.getMonth() + 1, 0));
            return { startDate, endDate };
        }

        return {
            startDate: new Date(year, 0, 1),
            endDate: clampToToday(new Date(year, 11, 31)),
        };
    }
}
