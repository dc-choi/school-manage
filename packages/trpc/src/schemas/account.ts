/**
 * Account 도메인 스키마
 */
import { z } from 'zod';

// ============================================================
// 입력 스키마 (Input Schemas)
// ============================================================

/**
 * 비밀번호 변경 입력 스키마
 */
export const changePasswordInputSchema = z.object({
    currentPassword: z.string().min(1, '현재 비밀번호는 필수입니다'),
    newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
});

/**
 * 프로필 수정 입력 스키마
 */
export const updateProfileInputSchema = z.object({
    displayName: z.string().min(2, '이름은 2자 이상이어야 합니다').max(20, '이름은 20자 이하여야 합니다'),
});

/**
 * 계정 삭제 입력 스키마
 */
export const deleteAccountInputSchema = z.object({
    password: z.string().min(1, '비밀번호는 필수입니다'),
});

// 입력 타입 export
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 계정 조회 응답
 */
export interface GetAccountOutput {
    id: string;
    name: string;
    displayName: string;
    privacyAgreedAt: Date | null;
}

/**
 * 개인정보 동의 응답
 */
export interface AgreePrivacyOutput {
    privacyAgreedAt: Date;
}

/**
 * 계정 수 조회 응답
 */
export interface GetAccountCountOutput {
    count: number;
}

/**
 * 비밀번호 변경 응답
 */
export interface ChangePasswordOutput {
    success: boolean;
}

/**
 * 프로필 수정 응답
 */
export interface UpdateProfileOutput {
    displayName: string;
}

/**
 * 계정 삭제 응답
 */
export interface DeleteAccountOutput {
    success: boolean;
}
