/**
 * 이탈 감지 도메인 타입/상수
 */

export const INACTIVE_THRESHOLD_DAYS = 14;
export const DEDUP_DAYS = 7;

export interface ChurnAlert {
    organizationId: bigint;
    churchName: string;
    organizationName: string;
    studentCount: number;
    inactiveDays: number;
    lastActivityDate: string;
}

export interface DetectChurnResult {
    skipped: boolean;
    skipReason?: string;
    alerts: ChurnAlert[];
}

export interface InactiveOrgRow {
    organizationId: bigint;
    lastDate: string;
}
