import { router } from '../trpc';
import { healthRouter } from './health';

/**
 * AppRouter - 모든 라우터의 단일 진입점
 */
export const appRouter = router({
    health: healthRouter,
});

/**
 * AppRouter 타입 (클라이언트에서 타입 추론에 사용)
 */
export type AppRouter = typeof appRouter;
