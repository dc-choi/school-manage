/**
 * Statistics 도메인 Zod 스키마
 */
import { z } from 'zod';

// ============================================================
// 입력 스키마 (Input Schemas)
// ============================================================

/**
 * 우수 학생 조회 입력 스키마
 */
export const getExcellentStudentsInputSchema = z.object({
    year: z.number().int().positive().optional(),
});

/**
 * 통계 공통 입력 스키마
 */
export const statisticsInputSchema = z.object({
    year: z.number().int().positive().optional(),
    month: z.number().int().min(1).max(12).optional(),
    week: z.number().int().min(1).max(5).optional(),
    day: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
        .optional(),
});

/**
 * TOP 조회용 입력 스키마
 */
export const topStatisticsInputSchema = z.object({
    year: z.number().int().positive().optional(),
    month: z.number().int().min(1).max(12).optional(),
    week: z.number().int().min(1).max(5).optional(),
    limit: z.number().int().positive().max(10).optional().default(5),
});

// 입력 타입 export
export type GetExcellentStudentsInput = z.infer<typeof getExcellentStudentsInputSchema>;
export type StatisticsInput = z.infer<typeof statisticsInputSchema>;
export type TopStatisticsInput = z.infer<typeof topStatisticsInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 우수 학생 정보
 * - raw query 호환을 위해 society_name은 snake_case 유지
 */
export interface ExcellentStudent {
    id: string;
    society_name: string;
    count: number;
}

/**
 * 우수 학생 조회 응답
 */
export interface GetExcellentStudentsOutput {
    excellentStudents: ExcellentStudent[];
}

/**
 * 출석률 응답
 */
export interface AttendanceRateOutput {
    year: number;
    period: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    attendanceRate: number;
    avgAttendance: number;
    totalStudents: number;
}

/**
 * 성별 분포 응답
 */
export interface GenderDistributionOutput {
    year: number;
    male: { count: number; rate: number };
    female: { count: number; rate: number };
    unknown: { count: number; rate: number };
}

/**
 * 그룹 순위 항목
 */
export interface TopGroupItem {
    groupId: string;
    groupName: string;
    attendanceRate: number;
}

/**
 * 그룹 순위 응답
 */
export interface TopGroupsOutput {
    year: number;
    groups: TopGroupItem[];
}

/**
 * 전체 우수 학생 항목
 */
export interface TopOverallStudentItem {
    id: string;
    societyName: string;
    groupName: string;
    score: number;
}

/**
 * 전체 우수 학생 응답
 */
export interface TopOverallOutput {
    year: number;
    students: TopOverallStudentItem[];
}

/**
 * 통계 기간 단위
 */
export type StatisticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 그룹별 상세 통계 항목
 */
export interface GroupStatisticsItem {
    groupId: string;
    groupName: string;
    groupType: string;
    daily: {
        attendanceRate: number;
        attendanceCount: number;
        startDate: string;
        endDate: string;
    };
    weekly: {
        attendanceRate: number;
        avgAttendance: number;
        startDate: string;
        endDate: string;
    };
    monthly: {
        attendanceRate: number;
        avgAttendance: number;
        startDate: string;
        endDate: string;
    };
    yearly: {
        attendanceRate: number;
        avgAttendance: number;
        startDate: string;
        endDate: string;
    };
    totalStudents: number;
    registeredStudents: number;
}

/**
 * 그룹별 상세 통계 응답
 *
 * - effectiveDay: 일간 집계 기준 일자(YYYY-MM-DD). 출석 데이터가 전혀 없고 input.day도 없으면 null.
 */
export interface GroupStatisticsOutput {
    year: number;
    effectiveDay: string | null;
    groups: GroupStatisticsItem[];
}
