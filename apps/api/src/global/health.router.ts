/**
 * Health Check 라우터
 */
import { publicProcedure, router } from '@school/trpc';

export const healthRouter = router({
    /**
     * 서버 상태 확인
     */
    check: publicProcedure.query(() => {
        return { status: 'ok' };
    }),
});
