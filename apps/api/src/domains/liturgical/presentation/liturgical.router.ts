/**
 * Liturgical tRPC 라우터
 *
 * 천주교 전례력 관련 procedure 정의
 */
import { GetHolydaysUseCase } from '../application/get-holydays.usecase.ts';
import { GetSeasonUseCase } from '../application/get-season.usecase.ts';
import { consentedProcedure, getHolydaysInputSchema, getSeasonInputSchema, router } from '@school/trpc';

export const liturgicalRouter = router({
    /**
     * 의무축일 조회
     * GET /api/liturgical/holydays -> trpc.liturgical.holydays
     */
    holydays: consentedProcedure.input(getHolydaysInputSchema).query(async ({ input }) => {
        const usecase = new GetHolydaysUseCase();
        return usecase.execute(input);
    }),

    /**
     * 전례 시기 조회
     * GET /api/liturgical/season -> trpc.liturgical.season
     */
    season: consentedProcedure.input(getSeasonInputSchema).query(async ({ input }) => {
        const usecase = new GetSeasonUseCase();
        return usecase.execute(input);
    }),
});
