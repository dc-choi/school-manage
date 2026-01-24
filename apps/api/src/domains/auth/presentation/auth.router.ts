/**
 * Auth tRPC 라우터
 *
 * 인증 관련 procedure 정의
 */
import { LoginUseCase } from '../application/login.usecase.js';
import { loginInputSchema, publicProcedure, router } from '@school/trpc';

export const authRouter = router({
    /**
     * 로그인
     * POST /api/auth/login -> trpc.auth.login
     */
    login: publicProcedure.input(loginInputSchema).mutation(async ({ input }) => {
        const usecase = new LoginUseCase();
        return usecase.execute(input);
    }),
});
