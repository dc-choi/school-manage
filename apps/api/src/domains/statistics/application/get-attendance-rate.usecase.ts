/**
 * Get Attendance Rate UseCase
 *
 * 주간/월간/연간 출석률 조회
 */
import type { AttendanceRateOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import { countSundays, formatDateCompact, getThisWeekSaturday, getThisWeekSunday, roundToDecimal } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

type Period = 'weekly' | 'monthly' | 'yearly';

export class GetAttendanceRateUseCase {
    async execute(input: StatisticsInput, period: Period): Promise<AttendanceRateOutput> {
        const year = input.year ?? new Date().getFullYear();
        const accountId = BigInt(input.accountId);

        // 1. 기간 계산
        const { startDate, endDate } = this.calculateDateRange(year, period);
        const startDateStr = formatDateCompact(startDate);
        const endDateStr = formatDateCompact(endDate);

        // 2. 계정 소속 그룹의 학생 조회 (졸업생 제외)
        const students = await database.student.findMany({
            where: {
                deletedAt: null,
                graduatedAt: null,
                group: {
                    accountId,
                    deletedAt: null,
                },
            },
            select: { id: true },
        });

        const totalStudents = students.length;

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

        const studentIds = students.map((s) => s.id);

        // 3. 기간 내 출석 데이터 조회
        const attendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                studentId: { in: studentIds },
                date: {
                    gte: startDateStr,
                    lte: endDateStr,
                },
                content: { in: ['◎', '○', '△'] }, // 출석으로 인정되는 상태
            },
        });

        // 4. 출석 일수 계산 (해당 기간 내 일요일 수)
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

        // 5. 출석률 계산
        const expectedAttendances = totalStudents * totalDays;
        const actualAttendances = attendances.length;
        const attendanceRate = (actualAttendances / expectedAttendances) * 100;

        // 6. 평균 출석 인원
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
    private calculateDateRange(year: number, period: Period): { startDate: Date; endDate: Date } {
        const now = new Date();

        if (period === 'weekly') {
            return {
                startDate: getThisWeekSunday(now),
                endDate: getThisWeekSaturday(now),
            };
        }

        if (period === 'monthly') {
            const startDate = new Date(year, now.getMonth(), 1);
            const endDate = new Date(year, now.getMonth() + 1, 0); // 마지막 날
            return { startDate, endDate };
        }

        // yearly
        return {
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
        };
    }
}
