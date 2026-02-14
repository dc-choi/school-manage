/**
 * Account tRPC 라우터
 *
 * 계정 관련 procedure 정의
 */
import { AgreePrivacyUseCase } from '../application/agree-privacy.usecase.js';
import { CountAccountsUseCase } from '../application/count-accounts.usecase.js';
import { GetAccountUseCase } from '../application/get-account.usecase.js';
import { protectedProcedure, publicProcedure, router } from '@school/trpc';

export const accountRouter = router({
    /**
     * 계정 정보 조회
     * GET /api/account -> trpc.account.get
     */
    get: protectedProcedure.query(async ({ ctx }) => {
        const usecase = new GetAccountUseCase();
        return usecase.execute(ctx.account);
    }),

    /**
     * 개인정보 수집·이용 동의
     * POST /api/account/agreePrivacy -> trpc.account.agreePrivacy
     */
    agreePrivacy: protectedProcedure.mutation(async ({ ctx }) => {
        const usecase = new AgreePrivacyUseCase();
        return usecase.execute(ctx.account.id);
    }),

    /**
     * 전체 가입 계정 수 조회
     * GET /api/account/count -> trpc.account.count
     */
    count: publicProcedure.query(async () => {
        const usecase = new CountAccountsUseCase();
        return usecase.execute();
    }),
});
