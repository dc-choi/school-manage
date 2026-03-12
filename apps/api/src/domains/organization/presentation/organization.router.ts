/**
 * Organization tRPC 라우터
 */
import { ApproveJoinUseCase } from '../application/approve-join.usecase.ts';
import { CreateOrganizationUseCase } from '../application/create-organization.usecase.ts';
import { ListMembersUseCase } from '../application/list-members.usecase.ts';
import { ListOrganizationsUseCase } from '../application/list-organizations.usecase.ts';
import { PendingRequestsUseCase } from '../application/pending-requests.usecase.ts';
import { RejectJoinUseCase } from '../application/reject-join.usecase.ts';
import { RequestJoinUseCase } from '../application/request-join.usecase.ts';
import {
    approveJoinInputSchema,
    consentedProcedure,
    createOrganizationInputSchema,
    listOrganizationsInputSchema,
    rejectJoinInputSchema,
    requestJoinInputSchema,
    router,
    scopedProcedure,
} from '@school/trpc';

export const organizationRouter = router({
    /**
     * 본당 내 조직 목록 조회 (consented)
     */
    list: consentedProcedure.input(listOrganizationsInputSchema).query(async ({ input }) => {
        const usecase = new ListOrganizationsUseCase();
        return usecase.execute(input);
    }),

    /**
     * 조직 생성 + admin 역할 설정 (consented)
     */
    create: consentedProcedure.input(createOrganizationInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CreateOrganizationUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 조직 합류 요청 (consented)
     */
    requestJoin: consentedProcedure.input(requestJoinInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RequestJoinUseCase();
        return usecase.execute(input, ctx.account.id, ctx.account.organizationId);
    }),

    /**
     * 대기 중인 합류 요청 목록 (scoped, admin)
     */
    pendingRequests: scopedProcedure.query(async ({ ctx }) => {
        const usecase = new PendingRequestsUseCase();
        return usecase.execute(ctx.organization.id, ctx.account.role);
    }),

    /**
     * 합류 요청 승인 (scoped, admin)
     */
    approveJoin: scopedProcedure.input(approveJoinInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new ApproveJoinUseCase();
        return usecase.execute(input, ctx.organization.id, ctx.account.role);
    }),

    /**
     * 합류 요청 거부 (scoped, admin)
     */
    rejectJoin: scopedProcedure.input(rejectJoinInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RejectJoinUseCase();
        return usecase.execute(input, ctx.organization.id, ctx.account.role);
    }),

    /**
     * 조직 멤버 목록 (scoped)
     */
    members: scopedProcedure.query(async ({ ctx }) => {
        const usecase = new ListMembersUseCase();
        return usecase.execute(ctx.organization.id);
    }),
});
