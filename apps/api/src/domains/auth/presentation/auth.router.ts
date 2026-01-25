/**
 * Auth tRPC 라우터
 *
 * 인증 관련 procedure 정의
 */
import { CheckIdUseCase } from '../application/check-id.usecase.js';
import { LoginUseCase } from '../application/login.usecase.js';
import { SignupUseCase } from '../application/signup.usecase.js';
import { checkIdInputSchema, loginInputSchema, publicProcedure, router, signupInputSchema } from '@school/trpc';

export const authRouter = router({
    /**
     * 로그인
     * POST /api/auth/login -> trpc.auth.login
     */
    login: publicProcedure.input(loginInputSchema).mutation(async ({ input }) => {
        const usecase = new LoginUseCase();
        return usecase.execute(input);
    }),

    /**
     * ID 중복 확인
     * GET /api/auth/checkId -> trpc.auth.checkId
     */
    checkId: publicProcedure.input(checkIdInputSchema).query(async ({ input }) => {
        const usecase = new CheckIdUseCase();
        return usecase.execute(input);
    }),

    /**
     * 회원가입
     * POST /api/auth/signup -> trpc.auth.signup
     */
    signup: publicProcedure.input(signupInputSchema).mutation(async ({ input }) => {
        const usecase = new SignupUseCase();
        return usecase.execute(input);
    }),
});
