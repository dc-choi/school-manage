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
import { ATTENDANCE_SCORE_SQL } from '~/domains/statistics/statistics.helper.js';
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
            .innerJoin('attendance as a', 'a.studentId', 's.id')
            .select(['s.id', 's.societyName'])
            .select(ATTENDANCE_SCORE_SQL.as('count'))
            .where('a.date', 'like', year + '%')
            .where('s.organizationId', '=', organizationId)
            .where('s.deleteAt', 'is', null)
            .where('a.deleteAt', 'is', null)
            .where(({ or, eb }) => or([eb('s.graduatedAt', 'is', null), eb(sql`YEAR(s.graduated_at)`, '>=', yearNum)]))
            .groupBy('s.id')
            .orderBy(sql`count`, 'desc')
            .limit(10)
            .execute();

        // 스냅샷 기반 이름 대체
        const referenceDate = new Date(Number(year), 11, 31);
        const studentIds = rawResults.map((r) => BigInt(r.id));
        const studentSnapshots = await getBulkStudentSnapshots(studentIds, referenceDate);

        // serializable types 변환
        const excellentStudents = rawResults.map((row, i) => {
            const snapshot = studentSnapshots.get(studentIds[i]);
            return {
                id: String(row.id),
                society_name: snapshot?.societyName ?? row.societyName,
                count: Number(row.count),
            };
        });

        return { excellentStudents };
    }
}
