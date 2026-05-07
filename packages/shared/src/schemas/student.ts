/**
 * Student 도메인 Zod 스키마
 */
import { GENDER } from '../constants.js';
import type { Gender } from '../constants.js';
import { idSchema, pageSchema, searchWordSchema } from './common.js';
import { z } from 'zod';

/**
 * 학생 목록 조회 입력 스키마
 */
export const listStudentsInputSchema = z.object({
    page: pageSchema,
    searchWord: searchWordSchema,
    includeDeleted: z.boolean().optional(),
    onlyDeleted: z.boolean().optional(),
    graduated: z.boolean().nullable().optional(), // null=전체, false=재학생(기본), true=졸업생
    registered: z.boolean().optional(), // true=등록만, false=미등록만, 미전달=전체
    registrationYear: z.number().int().positive().optional(), // 조회 연도 (기본값: 현재 연도)
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
    societyName: z.string().min(1, 'Society name is required').max(50, '이름은 50자 이하여야 합니다'),
    catholicName: z.string().max(50, '세례명은 50자 이하여야 합니다').optional(),
    gender: z.enum([GENDER.MALE, GENDER.FEMALE]).optional(),
    age: z.number().int().positive().optional(),
    // contact: 디지트만 허용 (E.164 최대 15자). DB는 VarChar(20) — 미래 포맷 여유 마진.
    contact: z
        .string()
        .regex(/^\d+$/, '전화번호는 숫자만 입력해주세요')
        .max(15, '전화번호는 15자 이하여야 합니다')
        .optional(),
    // parentContact: 사용자 입력 원본 보존(하이픈/괄호/공백 포함). DB VarChar(20)이 곧 입력 상한.
    parentContact: z
        .string()
        .regex(/^[\d\-() ]*$/, '부모님 연락처는 숫자·하이픈·괄호·공백만 입력해주세요')
        .max(20, '부모님 연락처는 20자 이하여야 합니다')
        .optional(),
    description: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
    groupIds: z.array(idSchema),
    baptizedAt: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/, '축일은 MM/DD 형식으로 입력해주세요.')
        .optional(),
    /** true면 동일 이름·세례명 중복 검증을 생략하고 강제 등록한다 (로드맵 2단계 — 학생 등록 중복 확인) */
    force: z.boolean().optional(),
});

/**
 * 학생 수정 입력 스키마 (partial update 지원)
 *
 * - undefined: 해당 필드 수정하지 않음 (skip)
 * - null: 해당 필드를 비움 (clear → DB NULL)
 * - 값: 해당 필드를 값으로 수정
 */
export const updateStudentInputSchema = z.object({
    id: idSchema,
    societyName: z.string().min(1, 'Society name is required').max(50, '이름은 50자 이하여야 합니다').optional(),
    catholicName: z.string().max(50, '세례명은 50자 이하여야 합니다').nullable().optional(),
    gender: z.enum([GENDER.MALE, GENDER.FEMALE]).nullable().optional(),
    age: z.number().int().positive().nullable().optional(),
    contact: z
        .string()
        .regex(/^\d+$/, '전화번호는 숫자만 입력해주세요')
        .max(15, '전화번호는 15자 이하여야 합니다')
        .nullable()
        .optional(),
    parentContact: z
        .string()
        .regex(/^[\d\-() ]*$/, '부모님 연락처는 숫자·하이픈·괄호·공백만 입력해주세요')
        .max(20, '부모님 연락처는 20자 이하여야 합니다')
        .nullable()
        .optional(),
    description: z.string().max(500, '비고는 500자 이하여야 합니다').nullable().optional(),
    groupIds: z.array(idSchema).optional(),
    baptizedAt: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/, '축일은 MM/DD 형식으로 입력해주세요.')
        .nullable()
        .optional(),
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

/**
 * 학생 일괄 생성 항목 스키마 (로드맵 2단계 — 서버측 재검증)
 *
 * 클라이언트 검증 우회 직접 호출 대비 필드별 상한/형식 강제. 단건 경로
 * `createStudentInputSchema`와 독립 운용하여 회귀 영향을 차단한다.
 */
export const bulkCreateStudentItemSchema = z.object({
    societyName: z.string().min(1, '이름은 필수입니다').max(50, '이름은 50자 이하여야 합니다'),
    catholicName: z.string().max(50, '세례명은 50자 이하여야 합니다').optional(),
    gender: z.enum([GENDER.MALE, GENDER.FEMALE]).optional(),
    age: z.number().int().min(1, '나이는 1 이상이어야 합니다').max(120, '나이는 120 이하여야 합니다').optional(),
    contact: z
        .string()
        .regex(/^\d+$/, '전화번호는 숫자만 입력해주세요')
        .max(15, '전화번호는 15자 이하여야 합니다')
        .optional(),
    parentContact: z
        .string()
        .regex(/^[\d\-() ]*$/, '부모님 연락처는 숫자·하이픈·괄호·공백만 입력해주세요')
        .max(20, '부모님 연락처는 20자 이하여야 합니다')
        .optional(),
    description: z.string().max(500, '비고는 500자 이하여야 합니다').optional(),
    baptizedAt: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/, '축일은 MM/DD 형식으로 입력해주세요.')
        .optional(),
    groupIds: z.array(idSchema).min(1, '최소 1개 그룹이 필요합니다').max(10, '한 학생당 그룹은 최대 10개까지입니다'),
    registered: z.boolean().optional(),
    /** true면 해당 행의 중복 검증을 생략한다 (로드맵 2단계 — 학생 등록 중복 확인) */
    force: z.boolean().optional(),
});

/**
 * 학생 일괄 생성 입력 스키마 (로드맵 2단계 — 엑셀 Import)
 */
export const bulkCreateStudentsInputSchema = z.object({
    students: z
        .array(bulkCreateStudentItemSchema)
        .min(1, '최소 1명의 학생이 필요합니다')
        .max(500, '최대 500명까지 등록 가능합니다'),
});

/**
 * 학생 일괄 등록 입력 스키마 (로드맵 2단계 — 등록 관리)
 */
export const bulkRegisterStudentsInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required').max(100, 'Maximum 100 students allowed'),
    year: z.number().int().positive().optional(),
});

/**
 * 학생 일괄 등록 취소 입력 스키마 (로드맵 2단계 — 등록 관리)
 */
export const bulkCancelRegistrationInputSchema = z.object({
    ids: z.array(idSchema).min(1, 'At least one student id is required').max(100, 'Maximum 100 students allowed'),
    year: z.number().int().positive().optional(),
});

/**
 * 학생 중복 사전 검증 입력 스키마 (로드맵 2단계 — 학생 등록 중복 확인)
 *
 * 엑셀 Import 미리보기 단계에서 입력 행들의 내부 중복 + DB 중복을 사전 점검한다.
 */
export const checkDuplicateInputSchema = z.object({
    students: z
        .array(
            z.object({
                societyName: z.string().min(1, '이름은 필수입니다').max(50, '이름은 50자 이하여야 합니다'),
                catholicName: z.string().max(50, '세례명은 50자 이하여야 합니다').optional(),
            })
        )
        .min(1, '최소 1명의 학생이 필요합니다')
        .max(500, '최대 500명까지 검사 가능합니다'),
});

/**
 * 축일자 목록 조회 입력 스키마
 */
export const feastDayListInputSchema = z.object({
    month: z.number().int().min(1).max(12),
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
export type BulkCreateStudentItem = z.infer<typeof bulkCreateStudentItemSchema>;
export type BulkCreateStudentsInput = z.infer<typeof bulkCreateStudentsInputSchema>;
export type CancelGraduationInput = z.infer<typeof cancelGraduationInputSchema>;
export type BulkRegisterStudentsInput = z.infer<typeof bulkRegisterStudentsInputSchema>;
export type BulkCancelRegistrationInput = z.infer<typeof bulkCancelRegistrationInputSchema>;
export type FeastDayListInput = z.infer<typeof feastDayListInputSchema>;
export type CheckDuplicateInput = z.infer<typeof checkDuplicateInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 학생이 속한 그룹 항목
 */
export interface StudentGroupItem {
    id: string;
    name: string;
    type: string;
}

/**
 * 기본 학생 정보
 * - group.attendance에서 사용
 */
export interface StudentBase {
    id: string;
    societyName: string;
    catholicName?: string;
    gender?: Gender;
    age?: number;
    contact?: string;
    parentContact?: string;
    description?: string;
    groups: StudentGroupItem[];
    baptizedAt?: string;
    graduatedAt?: string;
    deletedAt?: string;
}

/**
 * 그룹 포함 학생 정보
 * - student.list, student.get, student.create, student.update, student.delete에서 사용
 */
export interface StudentWithGroup extends StudentBase {
    isRegistered?: boolean;
}

/**
 * 학생 목록 조회 응답
 */
export interface RegistrationSummary {
    registeredCount: number;
    unregisteredCount: number;
}

export interface ListStudentsOutput {
    page: number;
    size: number;
    total: number;
    totalPage: number;
    students: StudentWithGroup[];
    registrationSummary?: RegistrationSummary;
}

/**
 * 학생 단일 조회/수정/삭제 응답
 * - 기존 API 호환성을 위해 StudentBase 사용 (groupName 미포함)
 */
export type GetStudentOutput = StudentBase;
export type UpdateStudentOutput = StudentBase;
export type DeleteStudentOutput = StudentBase;

/**
 * 학생 생성 응답
 * - 측정 인프라용 필드 포함 (선택적)
 */
export interface CreateStudentOutput extends StudentBase {
    /** 이 조직의 첫 번째 학생인지 (측정 인프라용) */
    isFirstStudent?: boolean;
    /** 조직 생성 후 경과일 (측정 인프라용) */
    daysSinceCreation?: number;
}

/**
 * 일괄 등록에서 중복으로 건너뛴 행 정보 (로드맵 2단계 — 학생 등록 중복 확인)
 */
export interface BulkCreateSkipped {
    /** 입력 배열 내 행 인덱스 */
    index: number;
    /** 충돌 사유 — 입력 내부 중복(INTERNAL_DUP) 또는 DB 기존 학생 충돌(DB_DUP) */
    reason: 'INTERNAL_DUP' | 'DB_DUP';
    /** 충돌 상대 메타: 입력 내부면 otherIndex, DB면 existingId */
    matchWith?: { id?: string; index?: number };
}

/**
 * 학생 일괄 등록 응답 (로드맵 2단계 — 엑셀 Import)
 */
export interface BulkCreateStudentsOutput {
    successCount: number;
    totalCount: number;
    /** force=false 행 중 중복으로 건너뛴 행 (로드맵 2단계 — 학생 등록 중복 확인) */
    skipped: BulkCreateSkipped[];
}

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
 * 졸업 제외된 학생 정보
 */
export interface SkippedStudent {
    id: string;
    societyName: string;
    reason: string;
}

/**
 * 일괄 졸업 처리 응답
 */
export interface GraduateStudentsOutput {
    success: boolean;
    graduatedCount: number;
    students: GraduatedStudent[];
    skipped: SkippedStudent[];
}

/**
 * 졸업 취소 응답
 */
export interface CancelGraduationOutput {
    success: boolean;
    cancelledCount: number;
    students: GraduatedStudent[];
}

/**
 * 축일자 학생 항목
 */
export interface FeastDayStudentItem {
    societyName: string;
    catholicName: string;
    baptizedAt: string;
    groupName: string;
}

/**
 * 축일자 목록 조회 응답
 */
export interface FeastDayListOutput {
    students: FeastDayStudentItem[];
}

/**
 * 학생 일괄 등록 응답 (로드맵 2단계 — 등록 관리)
 */
export interface BulkRegisterStudentsOutput {
    registeredCount: number;
}

/**
 * 학생 일괄 등록 취소 응답 (로드맵 2단계 — 등록 관리)
 */
export interface BulkCancelRegistrationOutput {
    cancelledCount: number;
}

/**
 * 중복 검사로 발견된 충돌 학생 메타 (로드맵 2단계 — 학생 등록 중복 확인)
 */
export interface ExistingStudentBrief {
    id: string;
    societyName: string;
    catholicName?: string;
    /** 학생이 속한 그룹 이름들 (학년 + 부서 모두) */
    groupNames: string[];
    /** 학생 등록일 ISO 문자열 */
    createdAt: string;
}

/**
 * 중복 검사 충돌 항목 (로드맵 2단계 — 학생 등록 중복 확인)
 */
export interface DuplicateConflict {
    /** 입력 배열 내 행 인덱스 */
    index: number;
    /** INTERNAL_DUP: 입력 배열 내부 중복 / DB_DUP: DB 기존 학생과 중복 */
    reason: 'INTERNAL_DUP' | 'DB_DUP';
    /** DB_DUP일 때 채워진다 */
    existing?: ExistingStudentBrief;
    /** INTERNAL_DUP일 때 매칭된 다른 입력 행 인덱스 */
    otherIndex?: number;
}

/**
 * 중복 사전 검사 응답 (로드맵 2단계 — 학생 등록 중복 확인)
 */
export interface DuplicateCheckOutput {
    conflicts: DuplicateConflict[];
}
