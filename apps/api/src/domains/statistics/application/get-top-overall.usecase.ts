/**
 * Get Top Overall UseCase
 *
 * 전체 우수 출석 학생 TOP N 조회 (스냅샷 기반)
 */
import type { TopOverallOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/shared';
import { clampToToday, formatDateCompact, getNowKST, getWeekRangeInMonth } from '@school/utils';
import { type SqlBool, sql } from 'kysely';
import { getBulkGroupSnapshots, getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type TopStatisticsInput = TopStatisticsSchemaInput & { organizationId: string };

export class GetTopOverallUseCase {
    async execute(input: TopStatisticsInput): Promise<TopOverallOutput> {
        const year = input.year ?? getNowKST().getFullYear();
        const { month, week } = input;
        const limit = input.limit ?? 5;
        const organizationId = Number(input.organizationId);

        // 날짜 범위 계산
        const { startDateStr, endDateStr } = this.getDateRange(year, month, week);

        // 전체 우수 학생 TOP N 조회 (Kysely — StudentGroup 경유)
        const rawResults = await database.$kysely
            .selectFrom('student as s')
            .innerJoin('student_group as sg', 'sg.student_id', 's._id')
            .innerJoin('group as g', 'g._id', 'sg.group_id')
            .leftJoin('attendance as a', (join) =>
                join
                    .onRef('a.student_id', '=', 's._id')
                    .on('a.date', '>=', startDateStr)
                    .on('a.date', '<=', endDateStr)
                    .on('a.delete_at', 'is', null)
            )
            .select(['s._id', 's.society_name', 'g.name as group_name', 'g._id as group_id'])
            .select(
                sql<number>`SUM(CASE
                    WHEN a.content = '◎' THEN 2
                    WHEN a.content = '○' THEN 1
                    WHEN a.content = '△' THEN 1
                    ELSE 0
                END)`.as('score')
            )
            .where('s.organization_id', '=', organizationId)
            .where('s.delete_at', 'is', null)
            .where(({ or, eb }) =>
                or([eb('s.graduated_at', 'is', null), sql<SqlBool>`s.graduated_at >= ${startDateStr}`])
            )
            .groupBy(['s._id', 'g._id', 'g.name'])
            .orderBy(sql`score`, 'desc')
            .limit(limit)
            .execute();

        if (rawResults.length === 0) {
            return { year, students: [] };
        }

        // 스냅샷 기반 이름 대체
        const referenceDate = new Date(year, 11, 31);
        const studentIds = rawResults.map((r) => BigInt(r._id));
        const groupIds = [...new Set(rawResults.map((r) => BigInt(r.group_id)))];

        const [studentSnapshots, groupSnapshots] = await Promise.all([
            getBulkStudentSnapshots(studentIds, referenceDate),
            getBulkGroupSnapshots(groupIds, referenceDate),
        ]);

        return {
            year,
            students: rawResults.map((row) => {
                const studentSnap = studentSnapshots.get(BigInt(row._id));
                const groupSnap = groupSnapshots.get(BigInt(row.group_id));

                return {
                    id: String(row._id),
                    societyName: studentSnap?.societyName ?? row.society_name,
                    groupName: groupSnap?.name ?? row.group_name,
                    score: Number(row.score ?? 0),
                };
            }),
        };
    }

    /**
     * 날짜 범위 계산
     */
    private getDateRange(year: number, month?: number, week?: number): { startDateStr: string; endDateStr: string } {
        if (month && week) {
            const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
            };
        }

        if (month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = clampToToday(new Date(year, month, 0));
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
            };
        }

        const startDate = new Date(year, 0, 1);
        const endDate = clampToToday(new Date(year, 11, 31));
        return {
            startDateStr: formatDateCompact(startDate),
            endDateStr: formatDateCompact(endDate),
        };
    }
}
