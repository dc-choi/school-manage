import { publicProcedure, router } from '../trpc';

/**
 * 헬스 체크 라우터
 */
export const healthRouter = router({
    /**
     * 서버 상태 확인
     */
    check: publicProcedure.query(() => {
        return { status: 'ok' };
    }),
});
