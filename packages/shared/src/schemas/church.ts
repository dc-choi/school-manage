/**
 * Church 도메인 Zod 스키마
 */
import { idSchema } from './common.js';
import { z } from 'zod';

/**
 * 본당 생성 입력 스키마
 */
export const createChurchInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    parishId: idSchema,
});

/**
 * 본당 검색 입력 스키마
 */
export const searchChurchesInputSchema = z.object({
    parishId: idSchema,
    query: z.string().optional(),
});

// 입력 타입 export
export type CreateChurchInput = z.infer<typeof createChurchInputSchema>;
export type SearchChurchesInput = z.infer<typeof searchChurchesInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 본당 생성 응답
 */
export interface CreateChurchOutput {
    id: string;
    name: string;
    parishId: string;
}

/**
 * 본당 검색 항목
 */
export interface SearchChurchItem {
    id: string;
    name: string;
    organizationCount: number;
}

/**
 * 본당 검색 응답
 */
export interface SearchChurchesOutput {
    churches: SearchChurchItem[];
}
