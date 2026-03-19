/**
 * 조직 현황 일일 보고서 UseCase
 *
 * 조직 활성화 현황 + 계정 현황을 DB에서 조회합니다.
 */
import { sql } from 'kysely';
import type { OrgAccountRow, OrgActivityRow, OrgDailyReportResult } from '~/domains/report/report.types.js';
import { database } from '~/infrastructure/database/database.js';

export class OrgDailyReportUseCase {
    async execute(): Promise<OrgDailyReportResult> {
        const [activityRows, accountRows] = await Promise.all([this.fetchOrgActivity(), this.fetchOrgAccounts()]);

        return { activityRows, accountRows };
    }

    /** 조직 활성화 현황 */
    private async fetchOrgActivity(): Promise<OrgActivityRow[]> {
        return database.$kysely
            .selectFrom('organization as o')
            .innerJoin('church as c', (join) => join.onRef('c.id', '=', 'o.churchId').on('c.deleteAt', 'is', null))
            .leftJoin('group as g', (join) => join.onRef('g.organizationId', '=', 'o.id').on('g.deleteAt', 'is', null))
            .leftJoin('student as s', (join) =>
                join.onRef('s.organizationId', '=', 'o.id').on('s.deleteAt', 'is', null)
            )
            .leftJoin('attendance as att', (join) =>
                join.onRef('att.studentId', '=', 's.id').on('att.deleteAt', 'is', null)
            )
            .select(['c.name as churchName', 'o.name as organizationName', 'o.type as organizationType'])
            .select(({ fn }) => [
                sql<bigint>`COUNT(DISTINCT g._id)`.as('groupCount'),
                sql<bigint>`COUNT(DISTINCT s._id)`.as('studentCount'),
                sql<bigint>`COUNT(DISTINCT att._id)`.as('attendanceCount'),
                fn.max('g.createAt').as('recentGroupCreateAt'),
                fn.max('s.createAt').as('recentStudentCreateAt'),
                fn.max('att.createAt').as('recentAttendanceAt'),
            ])
            .where('o.deleteAt', 'is', null)
            .groupBy(['o.id', 'c.name', 'o.name', 'o.type'])
            .orderBy(sql`recent_attendance_at`, 'desc')
            .orderBy(sql`recent_student_create_at`, 'desc')
            .orderBy(sql`recent_group_create_at`, 'desc')
            .$castTo<OrgActivityRow>()
            .execute();
    }

    /** 조직별 계정 현황 */
    private async fetchOrgAccounts(): Promise<OrgAccountRow[]> {
        return database.$kysely
            .selectFrom('account as a')
            .leftJoin('organization as o', (join) =>
                join.onRef('o.id', '=', 'a.organizationId').on('o.deleteAt', 'is', null)
            )
            .leftJoin('church as c', (join) => join.onRef('c.id', '=', 'o.churchId').on('c.deleteAt', 'is', null))
            .select(['c.name as churchName', 'o.name as organizationName', 'o.type as organizationType'])
            .select([
                sql<bigint>`COUNT(DISTINCT a._id)`.as('totalAccounts'),
                sql<string | null>`GROUP_CONCAT(DISTINCT a.display_name ORDER BY a.create_at SEPARATOR ', ')`.as(
                    'accountNames'
                ),
            ])
            .where('a.deleteAt', 'is', null)
            .where('a.privacyAgreedAt', 'is not', null)
            .groupBy(['o.id', 'c.name', 'o.name', 'o.type'])
            .orderBy('churchName')
            .$castTo<OrgAccountRow>()
            .execute();
    }
}
