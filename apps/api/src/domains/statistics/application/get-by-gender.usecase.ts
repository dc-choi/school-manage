/**
 * Get By Gender UseCase
 *
 * 성별 분포 조회
 */
import type { GenderDistributionOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import {
    countSundays,
    countSundaysInYear,
    formatDateCompact,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

export class GetByGenderUseCase {
    async execute(input: StatisticsInput): Promise<GenderDistributionOutput> {
        const year = input.year ?? new Date().getFullYear();
        const { month, week } = input;
        const accountId = BigInt(input.accountId);

        // 1. 날짜 범위 계산
        const { startDateStr, endDateStr, totalDays } = this.getDateRange(year, month, week);

        // 2. 계정 소속 그룹의 학생 조회 (성별 포함, 졸업생 제외)
        const students = await database.student.findMany({
            where: {
                deletedAt: null,
                graduatedAt: null,
                group: {
                    accountId,
                    deletedAt: null,
                },
            },
            select: { id: true, gender: true },
        });

        // 3. 성별 그룹화
        const maleStudents = students.filter((s) => s.gender === 'M');
        const femaleStudents = students.filter((s) => s.gender === 'F');
        const unknownStudents = students.filter((s) => s.gender === null || s.gender === undefined);

        // 4. 각 성별의 출석 데이터 조회 및 출석률 계산
        const calcRateForGroup = async (studentList: { id: bigint }[]): Promise<{ count: number; rate: number }> => {
            const count = studentList.length;
            if (count === 0) {
                return { count: 0, rate: 0 };
            }

            const studentIds = studentList.map((s) => s.id);
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

            const expected = count * totalDays;
            const rate = expected > 0 ? (attendances.length / expected) * 100 : 0;

            return {
                count,
                rate: roundToDecimal(rate, 1),
            };
        };

        const [male, female, unknown] = await Promise.all([
            calcRateForGroup(maleStudents),
            calcRateForGroup(femaleStudents),
            calcRateForGroup(unknownStudents),
        ]);

        return {
            year,
            male,
            female,
            unknown,
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
        // 월과 주차가 모두 지정된 경우
        if (month && week) {
            const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        // 월만 지정된 경우
        if (month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        // 기본: 연간
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return {
            startDateStr: formatDateCompact(startDate),
            endDateStr: formatDateCompact(endDate),
            totalDays: countSundaysInYear(year),
        };
    }
}
