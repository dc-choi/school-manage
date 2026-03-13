/**
 * Auth tRPC 라우터
 *
 * 인증 관련 procedure 정의
 */
import { CheckIdUseCase } from '../application/check-id.usecase.ts';
import { LoginUseCase } from '../application/login.usecase.ts';
import { LogoutUseCase } from '../application/logout.usecase.ts';
import { RefreshUseCase } from '../application/refresh.usecase.ts';
import { ResetPasswordUseCase } from '../application/reset-password.usecase.ts';
import { RestoreAccountUseCase } from '../application/restore-account.usecase.ts';
import { SignupUseCase } from '../application/signup.usecase.ts';
import {
    checkIdInputSchema,
    loginInputSchema,
    resetPasswordInputSchema,
    restoreAccountInputSchema,
    signupInputSchema,
} from '@school/shared';
import { publicProcedure, router } from '@school/trpc';

export const authRouter = router({
    /**
     * 로그인
     * POST /api/auth/login -> trpc.auth.login
     */
    login: publicProcedure.input(loginInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new LoginUseCase();
        return usecase.execute(input, ctx.res);
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
    signup: publicProcedure.input(signupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new SignupUseCase();
        return usecase.execute(input, ctx.res);
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
    restoreAccount: publicProcedure.input(restoreAccountInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RestoreAccountUseCase();
        return usecase.execute(input, ctx.res);
    }),

    /**
     * Access Token 갱신 (RTR)
     * POST /api/auth/refresh -> trpc.auth.refresh
     */
    refresh: publicProcedure.mutation(async ({ ctx }) => {
        const usecase = new RefreshUseCase();
        return usecase.execute(ctx.req, ctx.res);
    }),

    /**
     * 로그아웃
     * POST /api/auth/logout -> trpc.auth.logout
     */
    logout: publicProcedure.mutation(async ({ ctx }) => {
        const usecase = new LogoutUseCase();
        return usecase.execute(ctx.req, ctx.res);
    }),
});
