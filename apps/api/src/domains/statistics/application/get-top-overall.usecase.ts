/**
 * Get Top Overall UseCase
 *
 * 전체 우수 출석 학생 TOP N 조회
 */
import { Prisma } from '@prisma/client';
import type { TopOverallOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/trpc';
import { formatDateCompact, getWeekRangeInMonth } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type TopStatisticsInput = TopStatisticsSchemaInput & { accountId: string };

// Raw query result
interface StudentScoreRaw {
    _id: bigint;
    society_name: string;
    group_name: string;
    score: bigint;
}

export class GetTopOverallUseCase {
    async execute(input: TopStatisticsInput): Promise<TopOverallOutput> {
        const year = input.year ?? new Date().getFullYear();
        const { month, week } = input;
        const limit = input.limit ?? 5;
        const accountId = BigInt(input.accountId);

        // 날짜 범위 계산
        const { startDateStr, endDateStr } = this.getDateRange(year, month, week);

        // 전체 우수 학생 TOP N 조회 (Raw Query)
        const rawResults = await database.$queryRaw<StudentScoreRaw[]>(
            Prisma.sql`
                SELECT
                    s._id,
                    s.society_name,
                    g.name as group_name,
                    SUM(CASE
                        WHEN a.content = '◎' THEN 2
                        WHEN a.content = '○' THEN 1
                        WHEN a.content = '△' THEN 1
                        ELSE 0
                    END) as score
                FROM student s
                JOIN \`group\` g ON s.group_id = g._id
                LEFT JOIN attendance a ON s._id = a.student_id
                    AND a.date >= ${startDateStr}
                    AND a.date <= ${endDateStr}
                    AND a.delete_at IS NULL
                WHERE g.account_id = ${accountId}
                AND s.delete_at IS NULL
                AND s.graduated_at IS NULL
                AND g.delete_at IS NULL
                GROUP BY s._id, g.name
                ORDER BY score DESC
                LIMIT ${limit}
            `
        );

        return {
            year,
            students: rawResults.map((row) => ({
                id: String(row._id),
                societyName: row.society_name,
                groupName: row.group_name,
                score: Number(row.score ?? 0),
            })),
        };
    }

    /**
     * 날짜 범위 계산
     */
    private getDateRange(year: number, month?: number, week?: number): { startDateStr: string; endDateStr: string } {
        // 월과 주차가 모두 지정된 경우
        if (month && week) {
            const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
            };
        }

        // 월만 지정된 경우
        if (month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
            };
        }

        // 기본: 연간
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return {
            startDateStr: formatDateCompact(startDate),
            endDateStr: formatDateCompact(endDate),
        };
    }
}
