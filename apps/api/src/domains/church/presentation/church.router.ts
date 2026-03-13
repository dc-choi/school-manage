/**
 * Church tRPC 라우터
 */
import { CreateChurchUseCase } from '../application/create-church.usecase.ts';
import { SearchChurchesUseCase } from '../application/search-churches.usecase.ts';
import { consentedProcedure, router } from '@school/trpc';
import { createChurchInputSchema, searchChurchesInputSchema } from '@school/shared';

export const churchRouter = router({
    /**
     * 본당 생성
     */
    create: consentedProcedure.input(createChurchInputSchema).mutation(async ({ input }) => {
        const usecase = new CreateChurchUseCase();
        return usecase.execute(input);
    }),

    /**
     * 본당 검색
     */
    search: consentedProcedure.input(searchChurchesInputSchema).query(async ({ input }) => {
        const usecase = new SearchChurchesUseCase();
        return usecase.execute(input);
    }),
});
