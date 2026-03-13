/**
 * @school/trpc - tRPC 전용 패키지
 *
 * tRPC 인프라(router, procedures, middleware, context)만 포함
 * 도메인 상수/타입/스키마는 @school/shared에서 import
 */

// Context 타입
export type { Context, AuthContext, ScopedContext, BaseContext } from './context.js';

// tRPC 유틸리티
export {
    router,
    publicProcedure,
    protectedProcedure,
    consentedProcedure,
    scopedProcedure,
    middleware,
    transformer,
    createCallerFactory,
} from './trpc.js';
