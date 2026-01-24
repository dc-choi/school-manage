/**
 * Liturgical 도메인 Zod 스키마
 * 천주교 전례력 관련 (의무축일 등)
 */
import { z } from 'zod';

/**
 * 의무축일 조회 입력 스키마
 */
export const getHolydaysInputSchema = z.object({
    year: z.number().int().min(1583).max(2100), // 그레고리력 기준
});

// 입력 타입 export
export type GetHolydaysInput = z.infer<typeof getHolydaysInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 의무축일 정보
 */
export interface Holyday {
    date: string; // YYYY-MM-DD
    name: string; // 축일명
}

/**
 * 의무축일 조회 응답
 */
export interface GetHolydaysOutput {
    year: number;
    holydays: Holyday[];
}
