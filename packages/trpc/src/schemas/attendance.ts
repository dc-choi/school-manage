/**
 * Attendance 도메인 Zod 스키마
 */
import { idSchema } from './common';
import { z } from 'zod';

/**
 * 출석 데이터 단일 항목 스키마
 */
const attendanceDataSchema = z.object({
    id: idSchema,
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    data: z.string(),
});

/**
 * 출석 업데이트 입력 스키마
 */
export const updateAttendanceInputSchema = z.object({
    year: z.number().int().positive(),
    attendance: z.array(attendanceDataSchema).min(1, 'At least one attendance entry is required'),
    isFull: z.boolean(),
});

/**
 * 달력 조회 입력 스키마
 */
export const getCalendarInputSchema = z.object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    groupId: idSchema,
});

/**
 * 날짜별 출석 상세 조회 입력 스키마
 */
export const getDayDetailInputSchema = z.object({
    groupId: idSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
});

// 입력 타입 export
export type AttendanceData = z.infer<typeof attendanceDataSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceInputSchema>;
export type GetCalendarInput = z.infer<typeof getCalendarInputSchema>;
export type GetDayDetailInput = z.infer<typeof getDayDetailInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 출석 업데이트 응답
 */
export interface UpdateAttendanceOutput {
    row: number;
    isFull: boolean;
    /** 이 계정의 첫 번째 출석 기록인지 (측정 인프라용) */
    isFirstAttendance?: boolean;
    /** 가입 후 경과일 (측정 인프라용) */
    daysSinceSignup?: number;
    /** 저장된 출석 학생 수 (측정 인프라용) */
    studentCount?: number;
    /** 완전 출석 수 - ◎ (측정 인프라용) */
    fullAttendanceCount?: number;
    /** 미사만 출석 수 - ○ (측정 인프라용) */
    massOnlyCount?: number;
    /** 교리만 출석 수 - △ (측정 인프라용) */
    catechismOnlyCount?: number;
    /** 결석 수 - 또는 빈값 (측정 인프라용) */
    absentCount?: number;
    /** 출석률 % (측정 인프라용) */
    attendanceRate?: number;
}

/**
 * 달력 날짜별 출석 현황
 */
export interface CalendarDayAttendance {
    present: number; // 출석 인원 (미사 OR 교리)
    total: number; // 전체 학생 수
}

/**
 * 달력 날짜 데이터
 */
export interface CalendarDay {
    date: string; // YYYY-MM-DD
    dayOfWeek: number; // 0=일, 1=월, ..., 6=토
    attendance: CalendarDayAttendance;
    holyday: string | null; // 의무축일명 (해당 시)
}

/**
 * 달력 조회 응답
 */
export interface GetCalendarOutput {
    year: number;
    month: number;
    totalStudents: number;
    days: CalendarDay[];
}

/**
 * 학생별 출석 상태
 */
export interface StudentAttendanceDetail {
    id: string;
    societyName: string;
    catholicName?: string; // 세례명
    content: string; // O, X, ?, 빈 문자열
}

/**
 * 날짜별 출석 상세 조회 응답
 */
export interface GetDayDetailOutput {
    date: string;
    holyday: string | null;
    students: StudentAttendanceDetail[];
}

/**
 * 출석 기록 존재 여부 응답
 */
export interface HasAttendanceOutput {
    hasAttendance: boolean;
}
