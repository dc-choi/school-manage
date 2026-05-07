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

/** 사회적 증거 카운트 (랜딩 `trpc.account.count`와 동일 정의) */
export interface OrgSocialProof {
    churchCount: number;
    accountCount: number;
    studentCount: number;
}

/** 보고서 결과 */
export interface OrgDailyReportResult {
    activityRows: OrgActivityRow[];
    accountRows: OrgAccountRow[];
    socialProof: OrgSocialProof;
}
