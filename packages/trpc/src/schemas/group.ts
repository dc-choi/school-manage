/**
 * Group 도메인 Zod 스키마
 */
import { idSchema } from './common';
import type { StudentBase } from './student';
import { z } from 'zod';

/**
 * 그룹 ID 입력 스키마
 */
export const getGroupInputSchema = z.object({
    id: idSchema,
});

/**
 * 그룹 생성 입력 스키마
 */
export const createGroupInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

/**
 * 그룹 수정 입력 스키마
 */
export const updateGroupInputSchema = z.object({
    id: idSchema,
    name: z.string().min(1, 'Name is required'),
});

/**
 * 그룹 삭제 입력 스키마
 */
export const deleteGroupInputSchema = z.object({
    id: idSchema,
});

/**
 * 그룹 일괄 삭제 입력 스키마 (로드맵 1단계)
 */
export const bulkDeleteGroupsInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one group id is required'),
});

/**
 * 그룹 출석 조회 입력 스키마
 */
export const getGroupAttendanceInputSchema = z.object({
    groupId: idSchema,
    year: z.number().int().positive().optional(),
});

// 입력 타입 export
export type GetGroupInput = z.infer<typeof getGroupInputSchema>;
export type CreateGroupInput = z.infer<typeof createGroupInputSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupInputSchema>;
export type DeleteGroupInput = z.infer<typeof deleteGroupInputSchema>;
export type BulkDeleteGroupsInput = z.infer<typeof bulkDeleteGroupsInputSchema>;
export type GetGroupAttendanceInput = z.infer<typeof getGroupAttendanceInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 그룹 기본 정보
 */
export interface GroupOutput {
    id: string;
    name: string;
    accountId: string;
    studentCount: number;
}

/**
 * 그룹 생성 응답 (측정 인프라용 필드 포함)
 */
export interface CreateGroupOutput extends GroupOutput {
    isFirstGroup?: boolean;
    daysSinceSignup?: number;
}

/**
 * 그룹 상세 조회 응답 (학생 목록 포함, 로드맵 1단계)
 */
export interface GetGroupOutput extends GroupOutput {
    students: StudentBase[];
}

/**
 * 그룹 목록 조회 응답
 */
export interface ListGroupsOutput {
    groups: GroupOutput[];
}

/**
 * 출석 항목 (group.attendance 내부용)
 */
export interface AttendanceItem {
    id: string;
    studentId: string;
    date: string;
    content: string;
}

/**
 * 그룹 출석 조회 응답
 */
export interface GetGroupAttendanceOutput {
    year: number;
    sunday: number[][];
    saturday: number[][];
    students: StudentBase[];
    attendances: AttendanceItem[];
}

/**
 * 그룹 일괄 삭제 응답 (로드맵 1단계)
 */
export interface BulkDeleteGroupsOutput {
    deletedCount: number;
}
