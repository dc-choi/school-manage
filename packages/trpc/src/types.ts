/**
 * @school/trpc/types - 클라이언트용 타입 전용 엔트리
 *
 * 서버 런타임(express 등)에 의존하지 않는 타입만 export
 * 클라이언트는 이 엔트리만 import해야 함
 */

// AppRouter 타입 (타입 추론용)
export type { AppRouter } from './routers';

// 공유 타입 (서버 런타임 의존 없음)
export type { AccountInfo } from './shared';
