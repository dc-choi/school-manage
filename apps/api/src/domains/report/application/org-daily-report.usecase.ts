/**
 * 조직 현황 일일 보고서 UseCase
 *
 * 조직 활성화 현황 + 계정 현황을 DB에서 조회합니다.
 */
import type { OrgAccountRow, OrgActivityRow, OrgDailyReportResult } from '~/domains/report/report.types.js';
import { database } from '~/infrastructure/database/database.js';

export class OrgDailyReportUseCase {
    async execute(): Promise<OrgDailyReportResult> {
        const [activityRows, accountRows] = await Promise.all([this.fetchOrgActivity(), this.fetchOrgAccounts()]);

        return { activityRows, accountRows };
    }

    /** 조직 활성화 현황 */
    private async fetchOrgActivity(): Promise<OrgActivityRow[]> {
        return database.$queryRaw<OrgActivityRow[]>`
            SELECT
                c.name AS church_name,
                o.name AS organization_name,
                o.type AS organization_type,
                COUNT(DISTINCT g._id) AS group_count,
                COUNT(DISTINCT s._id) AS student_count,
                COUNT(DISTINCT att._id) AS attendance_count,
                MAX(g.create_at) AS recent_group_create_at,
                MAX(s.create_at) AS recent_student_create_at,
                MAX(att.create_at) AS recent_attendance_at
            FROM organization o
            JOIN church c ON c._id = o.church_id AND c.delete_at IS NULL
            LEFT JOIN \`group\` g ON g.organization_id = o._id AND g.delete_at IS NULL
            LEFT JOIN student s ON s.organization_id = o._id AND s.delete_at IS NULL
            LEFT JOIN attendance att ON att.student_id = s._id AND att.delete_at IS NULL
            WHERE o.delete_at IS NULL
            GROUP BY o._id, c.name, o.name, o.type
            ORDER BY recent_attendance_at DESC, recent_student_create_at DESC, recent_group_create_at DESC
        `;
    }

    /** 조직별 계정 현황 */
    private async fetchOrgAccounts(): Promise<OrgAccountRow[]> {
        return database.$queryRaw<OrgAccountRow[]>`
            SELECT
                c.name AS church_name,
                o.name AS organization_name,
                o.type AS organization_type,
                COUNT(DISTINCT a._id) AS total_accounts,
                GROUP_CONCAT(DISTINCT a.display_name ORDER BY a.create_at SEPARATOR ', ') AS account_names
            FROM account a
            LEFT JOIN organization o ON o._id = a.organization_id AND o.delete_at IS NULL
            LEFT JOIN church c ON c._id = o.church_id AND c.delete_at IS NULL
            WHERE a.delete_at IS NULL
            AND a.privacy_agreed_at IS NOT NULL
            GROUP BY o._id, c.name, o.name, o.type
            ORDER BY church_name
        `;
    }
}
