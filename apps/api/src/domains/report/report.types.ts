/**
 * 조직 현황 일일 보고서 타입
 */

/** 조직 활성화 현황 행 */
export interface OrgActivityRow {
    churchName: string;
    organizationName: string;
    organizationType: string;
    groupCount: bigint;
    studentCount: bigint;
    attendanceCount: bigint;
    recentGroupCreateAt: Date | null;
    recentStudentCreateAt: Date | null;
    recentAttendanceAt: Date | null;
}

/** 조직별 계정 현황 행 */
export interface OrgAccountRow {
    churchName: string;
    organizationName: string;
    organizationType: string;
    totalAccounts: bigint;
    accountNames: string | null;
}

/** 보고서 결과 */
export interface OrgDailyReportResult {
    activityRows: OrgActivityRow[];
    accountRows: OrgAccountRow[];
}
