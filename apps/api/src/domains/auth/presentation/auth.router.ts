/**
 * Auth tRPC 라우터
 *
 * 인증 관련 procedure 정의
 */
import { CheckIdUseCase } from '../application/check-id.usecase.ts';
import { LoginUseCase } from '../application/login.usecase.ts';
import { ResetPasswordUseCase } from '../application/reset-password.usecase.ts';
import { RestoreAccountUseCase } from '../application/restore-account.usecase.ts';
import { SignupUseCase } from '../application/signup.usecase.ts';
import {
    checkIdInputSchema,
    loginInputSchema,
    publicProcedure,
    resetPasswordInputSchema,
    restoreAccountInputSchema,
    router,
    signupInputSchema,
} from '@school/trpc';

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

    /**
     * 비밀번호 재설정
     * POST /api/auth/resetPassword -> trpc.auth.resetPassword
     */
    resetPassword: publicProcedure.input(resetPasswordInputSchema).mutation(async ({ input }) => {
        const usecase = new ResetPasswordUseCase();
        return usecase.execute(input);
    }),

    /**
     * 삭제된 계정 복원
     * POST /api/auth/restoreAccount -> trpc.auth.restoreAccount
     */
    restoreAccount: publicProcedure.input(restoreAccountInputSchema).mutation(async ({ input }) => {
        const usecase = new RestoreAccountUseCase();
        return usecase.execute(input);
    }),
});
