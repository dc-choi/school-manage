/**
 * Account 도메인 스키마
 */

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 계정 조회 응답
 */
export interface GetAccountOutput {
    id: string;
    name: string;
}

/**
 * 계정 수 조회 응답
 */
export interface GetAccountCountOutput {
    count: number;
}
