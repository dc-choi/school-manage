/**
 * Get Excellent Students UseCase
 *
 * 우수 출석 학생 조회
 */
import { Prisma } from '@prisma/client';
import type {
    GetExcellentStudentsOutput,
    GetExcellentStudentsInput as GetExcellentStudentsSchemaInput,
} from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

// Raw query result (BigInt)
interface ExcellentStudentRaw {
    _id: bigint;
    society_name: string;
    count: bigint;
}

// 스키마 타입 + context 필드
type GetExcellentStudentsInput = GetExcellentStudentsSchemaInput & { accountId: string };

export class GetExcellentStudentsUseCase {
    async execute(input: GetExcellentStudentsInput): Promise<GetExcellentStudentsOutput> {
        const year = input.year?.toString() ?? new Date().getFullYear().toString();
        const accountId = BigInt(input.accountId);

        const rawResults = await database.$queryRaw<ExcellentStudentRaw[]>(
            Prisma.sql`
                SELECT
                    s._id,
                    s.society_name,
                    SUM(CASE
                        WHEN a.content = '◎' THEN 2
                        WHEN a.content = '○' THEN 1
                        WHEN a.content = '△' THEN 1
                        ELSE 0
                    END) as count
                FROM student s
                JOIN attendance a ON s._id = a.student_id
                WHERE a.date LIKE ${year + '%'}
                AND s.group_id IN (
                    SELECT _id
                    FROM \`group\`
                    WHERE account_id = ${accountId}
                )
                AND s.delete_at IS NULL
                AND a.delete_at IS NULL
                GROUP BY s._id
                ORDER BY count DESC
                LIMIT 10
            `
        );

        // BigInt → serializable types 변환
        const excellentStudents = rawResults.map((row) => ({
            id: String(row._id),
            society_name: row.society_name,
            count: Number(row.count),
        }));

        return { excellentStudents };
    }
}
