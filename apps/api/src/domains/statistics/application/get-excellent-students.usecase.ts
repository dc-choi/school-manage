/**
 * Get Excellent Students UseCase
 *
 * 우수 출석 학생 조회 (스냅샷 기반)
 */
import type {
    GetExcellentStudentsOutput,
    GetExcellentStudentsInput as GetExcellentStudentsSchemaInput,
} from '@school/shared';
import { getNowKST } from '@school/utils';
import { sql } from 'kysely';
import { getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type GetExcellentStudentsInput = GetExcellentStudentsSchemaInput & { organizationId: string };

export class GetExcellentStudentsUseCase {
    async execute(input: GetExcellentStudentsInput): Promise<GetExcellentStudentsOutput> {
        const year = input.year?.toString() ?? getNowKST().getFullYear().toString();
        const yearNum = Number(year);
        const organizationId = Number(input.organizationId);

        const rawResults = await database.$kysely
            .selectFrom('student as s')
            .innerJoin('attendance as a', 'a.student_id', 's._id')
            .select(['s._id', 's.society_name'])
            .select(
                sql<number>`SUM(CASE
                    WHEN a.content = '◎' THEN 2
                    WHEN a.content = '○' THEN 1
                    WHEN a.content = '△' THEN 1
                    ELSE 0
                END)`.as('count')
            )
            .where('a.date', 'like', year + '%')
            .where('s.organization_id', '=', organizationId)
            .where('s.delete_at', 'is', null)
            .where('a.delete_at', 'is', null)
            .where(({ or, eb }) => or([eb('s.graduated_at', 'is', null), eb(sql`YEAR(s.graduated_at)`, '>=', yearNum)]))
            .groupBy('s._id')
            .orderBy(sql`count`, 'desc')
            .limit(10)
            .execute();

        // 스냅샷 기반 이름 대체
        const referenceDate = new Date(Number(year), 11, 31);
        const studentIds = rawResults.map((r) => BigInt(r._id));
        const studentSnapshots = await getBulkStudentSnapshots(studentIds, referenceDate);

        // serializable types 변환
        const excellentStudents = rawResults.map((row) => {
            const snapshot = studentSnapshots.get(BigInt(row._id));
            return {
                id: String(row._id),
                society_name: snapshot?.societyName ?? row.society_name,
                count: Number(row.count),
            };
        });

        return { excellentStudents };
    }
}
