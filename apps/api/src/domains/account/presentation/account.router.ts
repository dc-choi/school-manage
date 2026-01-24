/**
 * Account tRPC 라우터
 *
 * 계정 관련 procedure 정의
 */
import { GetAccountUseCase } from '../application/get-account.usecase.js';
import { protectedProcedure, router } from '@school/trpc';

export const accountRouter = router({
    /**
     * 계정 정보 조회
     * GET /api/account -> trpc.account.get
     */
    get: protectedProcedure.query(({ ctx }) => {
        const usecase = new GetAccountUseCase();
        return usecase.execute(ctx.account);
    }),
});
