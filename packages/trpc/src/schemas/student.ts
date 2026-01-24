/**
 * Student 도메인 Zod 스키마
 */
import { idSchema, pageSchema, searchOptionSchema, searchWordSchema } from './common';
import { z } from 'zod';

/**
 * 학생 목록 조회 입력 스키마
 */
export const listStudentsInputSchema = z.object({
    page: pageSchema,
    searchOption: searchOptionSchema,
    searchWord: searchWordSchema,
    includeDeleted: z.boolean().optional(),
    onlyDeleted: z.boolean().optional(),
    graduated: z.boolean().nullable().optional(), // null=전체, false=재학생(기본), true=졸업생
});

/**
 * 학생 ID 입력 스키마
 */
export const getStudentInputSchema = z.object({
    id: idSchema,
});

/**
 * 학생 생성 입력 스키마
 */
export const createStudentInputSchema = z.object({
    societyName: z.string().min(1, 'Society name is required'),
    catholicName: z.string().optional(),
    age: z.number().int().positive().optional(),
    contact: z.number().optional(),
    description: z.string().optional(),
    groupId: idSchema,
    baptizedAt: z.string().optional(),
});

/**
 * 학생 수정 입력 스키마
 */
export const updateStudentInputSchema = z.object({
    id: idSchema,
    societyName: z.string().min(1, 'Society name is required'),
    catholicName: z.string().optional(),
    age: z.number().int().positive().optional(),
    contact: z.number().optional(),
    description: z.string().optional(),
    groupId: idSchema,
    baptizedAt: z.string().optional(),
});

/**
 * 학생 삭제 입력 스키마
 */
export const deleteStudentInputSchema = z.object({
    id: idSchema,
});

/**
 * 학생 일괄 삭제 입력 스키마 (로드맵 1단계)
 */
export const bulkDeleteStudentsInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required'),
});

/**
 * 학생 복구 입력 스키마 (로드맵 1단계)
 */
export const restoreStudentsInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required'),
});

/**
 * 일괄 졸업 처리 입력 스키마
 */
export const graduateStudentsInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required').max(100, 'Maximum 100 students allowed'),
});

/**
 * 졸업 취소 입력 스키마
 */
export const cancelGraduationInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required').max(100, 'Maximum 100 students allowed'),
});

// 입력 타입 export
export type ListStudentsInput = z.infer<typeof listStudentsInputSchema>;
export type GetStudentInput = z.infer<typeof getStudentInputSchema>;
export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;
export type DeleteStudentInput = z.infer<typeof deleteStudentInputSchema>;
export type BulkDeleteStudentsInput = z.infer<typeof bulkDeleteStudentsInputSchema>;
export type RestoreStudentsInput = z.infer<typeof restoreStudentsInputSchema>;
export type GraduateStudentsInput = z.infer<typeof graduateStudentsInputSchema>;
export type CancelGraduationInput = z.infer<typeof cancelGraduationInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 기본 학생 정보 (그룹명 미포함)
 * - group.attendance에서 사용
 */
export interface StudentBase {
    id: string;
    societyName: string;
    catholicName?: string;
    gender?: string;
    age?: number;
    contact?: number;
    description?: string;
    groupId: string;
    baptizedAt?: string;
    graduatedAt?: string;
    deletedAt?: string;
}

/**
 * 그룹명 포함 학생 정보
 * - student.list, student.get, student.create, student.update, student.delete에서 사용
 */
export interface StudentWithGroup extends StudentBase {
    groupName: string;
    deletedAt?: string;
}

/**
 * 학생 목록 조회 응답
 */
export interface ListStudentsOutput {
    page: number;
    size: number;
    totalPage: number;
    students: StudentWithGroup[];
}

/**
 * 학생 단일 조회/생성/수정/삭제 응답
 * - 기존 API 호환성을 위해 StudentBase 사용 (groupName 미포함)
 */
export type GetStudentOutput = StudentBase;
export type CreateStudentOutput = StudentBase;
export type UpdateStudentOutput = StudentBase;
export type DeleteStudentOutput = StudentBase;

/**
 * 학년 진급 응답 (기존 학생 졸업 처리 → 진급으로 이름 변경)
 */
export interface PromoteStudentsOutput {
    row: number;
}

/**
 * 학생 일괄 삭제 응답 (로드맵 1단계)
 */
export interface BulkDeleteStudentsOutput {
    deletedCount: number;
}

/**
 * 학생 복구 응답 (로드맵 1단계)
 */
export interface RestoreStudentsOutput {
    restoredCount: number;
}

/**
 * 졸업 처리된 학생 정보
 */
export interface GraduatedStudent {
    id: string;
    societyName: string;
    graduatedAt: string | null;
}

/**
 * 일괄 졸업 처리 응답
 */
export interface GraduateStudentsOutput {
    success: boolean;
    graduatedCount: number;
    students: GraduatedStudent[];
}

/**
 * 졸업 취소 응답
 */
export interface CancelGraduationOutput {
    success: boolean;
    cancelledCount: number;
    students: GraduatedStudent[];
}
