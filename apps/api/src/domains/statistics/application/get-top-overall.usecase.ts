/**
 * Get Top Overall UseCase
 *
 * 전체 우수 출석 학생 TOP N 조회 (스냅샷 기반)
 */
import type { TopOverallOutput, TopStatisticsInput as TopStatisticsSchemaInput } from '@school/shared';
import { clampToToday, formatDateCompact, getNowKST, getWeekRangeInMonth } from '@school/utils';
import { type SqlBool, sql } from 'kysely';
import { getBulkGroupSnapshots, getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { ATTENDANCE_SCORE_SQL } from '~/domains/statistics/statistics.helper.js';
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
            .innerJoin('studentGroup as sg', 'sg.studentId', 's.id')
            .innerJoin('group as g', 'g.id', 'sg.groupId')
            .leftJoin('attendance as a', (join) =>
                join
                    .onRef('a.studentId', '=', 's.id')
                    .on('a.date', '>=', startDateStr)
                    .on('a.date', '<=', endDateStr)
                    .on('a.deleteAt', 'is', null)
            )
            .select(['s.id', 's.societyName', 'g.name as groupName', 'g.id as groupId'])
            .select(ATTENDANCE_SCORE_SQL.as('score'))
            .where('s.organizationId', '=', organizationId)
            .where('s.deleteAt', 'is', null)
            .where(({ or, eb }) =>
                or([eb('s.graduatedAt', 'is', null), sql<SqlBool>`s.graduated_at >= ${startDateStr}`])
            )
            .groupBy(['s.id', 'g.id', 'g.name'])
            .orderBy(sql`score`, 'desc')
            .limit(limit)
            .execute();

        if (rawResults.length === 0) {
            return { year, students: [] };
        }

        // 스냅샷 기반 이름 대체
        const referenceDate = new Date(year, 11, 31);
        const studentIds = rawResults.map((r) => BigInt(r.id));
        const groupIds = [...new Set(rawResults.map((r) => BigInt(r.groupId)))];

        const [studentSnapshots, groupSnapshots] = await Promise.all([
            getBulkStudentSnapshots(studentIds, referenceDate),
            getBulkGroupSnapshots(groupIds, referenceDate),
        ]);

        return {
            year,
            students: rawResults.map((row, i) => {
                const studentSnap = studentSnapshots.get(studentIds[i]);
                const groupSnap = groupSnapshots.get(BigInt(row.groupId));

                return {
                    id: String(row.id),
                    societyName: studentSnap?.societyName ?? row.societyName,
                    groupName: groupSnap?.name ?? row.groupName,
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
