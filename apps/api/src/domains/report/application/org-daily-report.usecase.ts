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
            .innerJoin('church as c', (join) => join.onRef('c._id', '=', 'o.church_id').on('c.delete_at', 'is', null))
            .leftJoin('group as g', (join) =>
                join.onRef('g.organization_id', '=', 'o._id').on('g.delete_at', 'is', null)
            )
            .leftJoin('student as s', (join) =>
                join.onRef('s.organization_id', '=', 'o._id').on('s.delete_at', 'is', null)
            )
            .leftJoin('attendance as att', (join) =>
                join.onRef('att.student_id', '=', 's._id').on('att.delete_at', 'is', null)
            )
            .select(['c.name as church_name', 'o.name as organization_name', 'o.type as organization_type'])
            .select(({ fn }) => [
                sql<bigint>`COUNT(DISTINCT g._id)`.as('group_count'),
                sql<bigint>`COUNT(DISTINCT s._id)`.as('student_count'),
                sql<bigint>`COUNT(DISTINCT att._id)`.as('attendance_count'),
                fn.max('g.create_at').as('recent_group_create_at'),
                fn.max('s.create_at').as('recent_student_create_at'),
                fn.max('att.create_at').as('recent_attendance_at'),
            ])
            .where('o.delete_at', 'is', null)
            .groupBy(['o._id', 'c.name', 'o.name', 'o.type'])
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
                join.onRef('o._id', '=', 'a.organization_id').on('o.delete_at', 'is', null)
            )
            .leftJoin('church as c', (join) => join.onRef('c._id', '=', 'o.church_id').on('c.delete_at', 'is', null))
            .select(['c.name as church_name', 'o.name as organization_name', 'o.type as organization_type'])
            .select([
                sql<bigint>`COUNT(DISTINCT a._id)`.as('total_accounts'),
                sql<string | null>`GROUP_CONCAT(DISTINCT a.display_name ORDER BY a.create_at SEPARATOR ', ')`.as(
                    'account_names'
                ),
            ])
            .where('a.delete_at', 'is', null)
            .where('a.privacy_agreed_at', 'is not', null)
            .groupBy(['o._id', 'c.name', 'o.name', 'o.type'])
            .orderBy('church_name')
            .$castTo<OrgAccountRow>()
            .execute();
    }
}
