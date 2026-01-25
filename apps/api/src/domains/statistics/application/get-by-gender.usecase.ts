/**
 * Get By Gender UseCase
 *
 * 성별 분포 조회
 */
import type { GenderDistributionOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import { countSundaysInYear, roundToDecimal } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

export class GetByGenderUseCase {
    async execute(input: StatisticsInput): Promise<GenderDistributionOutput> {
        const year = input.year ?? new Date().getFullYear();
        const accountId = BigInt(input.accountId);
        const yearStr = String(year);

        // 1. 계정 소속 그룹의 학생 조회 (성별 포함, 졸업생 제외)
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

        // 2. 성별 그룹화
        const maleStudents = students.filter((s) => s.gender === 'M');
        const femaleStudents = students.filter((s) => s.gender === 'F');
        const unknownStudents = students.filter((s) => s.gender === null || s.gender === undefined);

        // 3. 연간 일요일 수
        const totalDays = countSundaysInYear(year);

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
                    date: { startsWith: yearStr },
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
}
