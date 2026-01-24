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

// 입력 타입 export
export type LoginInput = z.infer<typeof loginInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 로그인 응답
 */
export interface LoginOutput {
    name: string;
    accessToken: string;
}
