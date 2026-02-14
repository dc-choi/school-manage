/**
 * Account tRPC 라우터
 *
 * 계정 관련 procedure 정의
 */
import { AgreePrivacyUseCase } from '../application/agree-privacy.usecase.ts';
import { ChangePasswordUseCase } from '../application/change-password.usecase.ts';
import { CountAccountsUseCase } from '../application/count-accounts.usecase.ts';
import { DeleteAccountUseCase } from '../application/delete-account.usecase.ts';
import { GetAccountUseCase } from '../application/get-account.usecase.ts';
import { UpdateProfileUseCase } from '../application/update-profile.usecase.ts';
import {
    changePasswordInputSchema,
    consentedProcedure,
    deleteAccountInputSchema,
    protectedProcedure,
    publicProcedure,
    router,
    updateProfileInputSchema,
} from '@school/trpc';

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

    /**
     * 비밀번호 변경
     * POST /api/account/changePassword -> trpc.account.changePassword
     */
    changePassword: consentedProcedure.input(changePasswordInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new ChangePasswordUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 프로필 수정 (이름 변경)
     * POST /api/account/updateProfile -> trpc.account.updateProfile
     */
    updateProfile: consentedProcedure.input(updateProfileInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new UpdateProfileUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 계정 삭제 (소프트 삭제)
     * POST /api/account/deleteAccount -> trpc.account.deleteAccount
     */
    deleteAccount: consentedProcedure.input(deleteAccountInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new DeleteAccountUseCase();
        return usecase.execute(input, ctx.account.id);
    }),
});
