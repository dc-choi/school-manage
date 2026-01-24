import type { AuthContext, Context } from './context';
import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';

/**
 * tRPC transformer
 * - Date, BigInt, Map, Set 등 비-JSON 타입 자동 직렬화
 * - 서버/클라이언트 동일 transformer 사용 필요
 */
export const transformer = superjson;

/**
 * tRPC 초기화
 */
const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

/**
 * 라우터 생성 함수
 */
export const router = t.router;

/**
 * 미들웨어 생성 함수
 */
export const middleware = t.middleware;

/**
 * 공용 프로시저 (인증 불필요)
 */
export const publicProcedure = t.procedure;

/**
 * 인증 확인 미들웨어
 *
 * ctx.account 존재 여부를 확인하고, 명시적 객체 생성으로 타입 좁히기 적용
 */
const isAuthenticated = middleware(async (opts) => {
    const { ctx } = opts;

    if (!ctx.account) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'UNAUTHORIZED: TOKEN NOT_FOUND',
        });
    }

    // 명시적 객체 생성으로 타입 좁히기 (as 타입 단언 제거)
    const authenticatedCtx: AuthContext = {
        req: ctx.req,
        res: ctx.res,
        account: ctx.account,
    };

    return opts.next({
        ctx: authenticatedCtx,
    });
});

/**
 * 보호된 프로시저 (인증 필수)
 */
export const protectedProcedure = publicProcedure.use(isAuthenticated);

/**
 * createCaller 팩토리
 *
 * 테스트 및 서버사이드에서 프로시저를 직접 호출할 때 사용
 *
 * @example
 * ```typescript
 * import { createCallerFactory } from '@school/trpc';
 * import { appRouter } from './app.router';
 *
 * const createCaller = createCallerFactory(appRouter);
 * const caller = createCaller(context);
 * const result = await caller.auth.login({ id, password });
 * ```
 */
export const createCallerFactory = t.createCallerFactory;
