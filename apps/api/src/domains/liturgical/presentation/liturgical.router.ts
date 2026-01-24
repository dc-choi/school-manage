/**
 * Liturgical tRPC 라우터
 *
 * 천주교 전례력 관련 procedure 정의
 */
import { GetHolydaysUseCase } from '../application/get-holydays.usecase.js';
import { getHolydaysInputSchema, protectedProcedure, router } from '@school/trpc';

export const liturgicalRouter = router({
    /**
     * 의무축일 조회
     * GET /api/liturgical/holydays -> trpc.liturgical.holydays
     */
    holydays: protectedProcedure.input(getHolydaysInputSchema).query(async ({ input }) => {
        const usecase = new GetHolydaysUseCase();
        return usecase.execute(input);
    }),
});
