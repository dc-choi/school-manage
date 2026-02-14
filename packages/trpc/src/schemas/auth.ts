/**
 * Auth 도메인 Zod 스키마
 */
import { z } from 'zod';

/**
 * 로그인 입력 스키마
 */
export const loginInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * ID 중복 확인 입력 스키마
 */
export const checkIdInputSchema = z.object({
    name: z
        .string()
        .min(4, 'ID는 4자 이상이어야 합니다')
        .max(20, 'ID는 20자 이하여야 합니다')
        .regex(/^[a-zA-Z0-9]+$/, 'ID는 영문자와 숫자만 사용 가능합니다'),
});

/**
 * 회원가입 입력 스키마
 */
export const signupInputSchema = z.object({
    name: z
        .string()
        .min(4, 'ID는 4자 이상이어야 합니다')
        .max(20, 'ID는 20자 이하여야 합니다')
        .regex(/^[a-zA-Z0-9]+$/, 'ID는 영문자와 숫자만 사용 가능합니다'),
    displayName: z.string().min(2, '이름은 2자 이상이어야 합니다').max(20, '이름은 20자 이하여야 합니다'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    privacyAgreed: z.literal(true, {
        errorMap: () => ({ message: '개인정보 수집·이용에 동의해야 합니다' }),
    }),
});

// 입력 타입 export
export type LoginInput = z.infer<typeof loginInputSchema>;
export type CheckIdInput = z.infer<typeof checkIdInputSchema>;
export type SignupInput = z.infer<typeof signupInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 로그인 응답
 */
export interface LoginOutput {
    name: string;
    displayName: string;
    accessToken: string;
}

/**
 * ID 중복 확인 응답
 */
export interface CheckIdOutput {
    available: boolean;
}

/**
 * 회원가입 응답
 */
export interface SignupOutput {
    name: string;
    displayName: string;
    accessToken: string;
}
