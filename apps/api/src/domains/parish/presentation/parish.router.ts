/**
 * Parish tRPC 라우터
 */
import { ListParishesUseCase } from '../application/list-parishes.usecase.ts';
import { consentedProcedure, router } from '@school/trpc';

export const parishRouter = router({
    /**
     * 교구 목록 조회
     */
    list: consentedProcedure.query(async () => {
        const usecase = new ListParishesUseCase();
        return usecase.execute();
    }),
});
