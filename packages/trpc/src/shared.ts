/**
 * @school/trpc/shared - 공통 타입 정의
 *
 * 서버/클라이언트 모두에서 사용하는 공통 타입
 * 런타임 의존성 없음
 */

/**
 * 인증된 계정 정보
 */
export interface AccountInfo {
    id: string;
    name: string;
    displayName: string;
}
