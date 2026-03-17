/**
 * 조직 현황 일일 보고서 타입
 */

/** 조직 활성화 현황 행 */
export interface OrgActivityRow {
    church_name: string;
    organization_name: string;
    organization_type: string;
    group_count: bigint;
    student_count: bigint;
    attendance_count: bigint;
    recent_group_create_at: Date | null;
    recent_student_create_at: Date | null;
    recent_attendance_at: Date | null;
}

/** 조직별 계정 현황 행 */
export interface OrgAccountRow {
    church_name: string;
    organization_name: string;
    organization_type: string;
    total_accounts: bigint;
    account_names: string | null;
}

/** 보고서 결과 */
export interface OrgDailyReportResult {
    activityRows: OrgActivityRow[];
    accountRows: OrgAccountRow[];
}
