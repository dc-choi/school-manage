/**
 * Parish 도메인 Zod 스키마
 */

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 교구 기본 정보
 */
export interface ParishItem {
    id: string;
    name: string;
}

/**
 * 교구 목록 조회 응답
 */
export interface ListParishesOutput {
    parishes: ParishItem[];
}
