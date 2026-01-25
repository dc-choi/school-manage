/**
 * Get Top Groups UseCase
 *
 * 그룹별 출석률 순위 TOP N 조회
 */
import type { TopGroupsOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/trpc';
import { countSundaysInYear, roundToDecimal } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type TopStatisticsInput = TopStatisticsSchemaInput & { accountId: string };

export class GetTopGroupsUseCase {
    async execute(input: TopStatisticsInput): Promise<TopGroupsOutput> {
        const year = input.year ?? new Date().getFullYear();
        const limit = input.limit ?? 5;
        const accountId = BigInt(input.accountId);
        const yearStr = String(year);

        // 1. 계정 소속 그룹 조회
        const groups = await database.group.findMany({
            where: {
                accountId,
                deletedAt: null,
            },
            select: { id: true, name: true },
        });

        // 2. 연간 일요일 수
        const totalDays = countSundaysInYear(year);

        // 3. 각 그룹별 출석률 계산
        const groupRates = await Promise.all(
            groups.map(async (group) => {
                const students = await database.student.findMany({
                    where: {
                        groupId: group.id,
                        deletedAt: null,
                        graduatedAt: null,
                    },
                    select: { id: true },
                });

                if (students.length === 0) {
                    return null; // 학생이 없는 그룹은 제외
                }

                const studentIds = students.map((s) => s.id);
                const attendances = await database.attendance.findMany({
                    where: {
                        deletedAt: null,
                        studentId: { in: studentIds },
                        date: { startsWith: yearStr },
                        content: { in: ['◎', '○', '△'] },
                    },
                });

                const expected = students.length * totalDays;
                const rate = expected > 0 ? (attendances.length / expected) * 100 : 0;

                return {
                    groupId: String(group.id),
                    groupName: group.name,
                    attendanceRate: roundToDecimal(rate, 1),
                };
            })
        );

        // 4. null 제거 후 출석률 높은 순 정렬
        const validGroups = groupRates.filter((g) => g !== null);
        validGroups.sort((a, b) => b.attendanceRate - a.attendanceRate);

        return {
            year,
            groups: validGroups.slice(0, limit),
        };
    }
}
