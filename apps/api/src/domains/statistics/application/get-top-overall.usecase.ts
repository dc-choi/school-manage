/**
 * Get Top Overall UseCase
 *
 * 전체 우수 출석 학생 TOP N 조회
 */
import { Prisma } from '@prisma/client';
import type { TopOverallOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/trpc';
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
        const limit = input.limit ?? 5;
        const accountId = BigInt(input.accountId);
        const yearPattern = `${year}%`;

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
                    AND a.date LIKE ${yearPattern}
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
}
