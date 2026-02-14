/**
 * Group tRPC 라우터
 *
 * 그룹 관련 procedure 정의
 */
import { BulkDeleteGroupsUseCase } from '../application/bulk-delete-groups.usecase.ts';
import { CreateGroupUseCase } from '../application/create-group.usecase.ts';
import { DeleteGroupUseCase } from '../application/delete-group.usecase.ts';
import { GetGroupAttendanceUseCase } from '../application/get-group-attendance.usecase.ts';
import { GetGroupUseCase } from '../application/get-group.usecase.ts';
import { ListGroupsUseCase } from '../application/list-groups.usecase.ts';
import { UpdateGroupUseCase } from '../application/update-group.usecase.ts';
import {
    bulkDeleteGroupsInputSchema,
    consentedProcedure,
    createGroupInputSchema,
    deleteGroupInputSchema,
    getGroupAttendanceInputSchema,
    getGroupInputSchema,
    router,
    updateGroupInputSchema,
} from '@school/trpc';

export const groupRouter = router({
    /**
     * 그룹 목록 조회
     * GET /api/group -> trpc.group.list
     */
    list: consentedProcedure.query(async ({ ctx }) => {
        const usecase = new ListGroupsUseCase();
        return usecase.execute(ctx.account.id);
    }),

    /**
     * 단일 그룹 조회
     * GET /api/group/:groupId -> trpc.group.get
     */
    get: consentedProcedure.input(getGroupInputSchema).query(async ({ input }) => {
        const usecase = new GetGroupUseCase();
        return usecase.execute(input);
    }),

    /**
     * 그룹 생성
     * POST /api/group -> trpc.group.create
     */
    create: consentedProcedure.input(createGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CreateGroupUseCase();
        return usecase.execute({
            name: input.name,
            accountId: ctx.account.id,
        });
    }),

    /**
     * 그룹 수정
     * PUT /api/group/:groupId -> trpc.group.update
     */
    update: consentedProcedure.input(updateGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new UpdateGroupUseCase();
        return usecase.execute({
            id: input.id,
            name: input.name,
            accountId: ctx.account.id,
        });
    }),

    /**
     * 그룹 삭제
     * DELETE /api/group/:groupId -> trpc.group.delete
     */
    delete: consentedProcedure.input(deleteGroupInputSchema).mutation(async ({ input }) => {
        const usecase = new DeleteGroupUseCase();
        return usecase.execute(input);
    }),

    /**
     * 그룹 일괄 삭제 (로드맵 1단계)
     * POST /api/group/bulk-delete -> trpc.group.bulkDelete
     */
    bulkDelete: consentedProcedure.input(bulkDeleteGroupsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkDeleteGroupsUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 그룹별 출석 조회
     * GET /api/group/:groupId/attendance -> trpc.group.attendance
     */
    attendance: consentedProcedure.input(getGroupAttendanceInputSchema).query(async ({ input }) => {
        const usecase = new GetGroupAttendanceUseCase();
        return usecase.execute(input);
    }),
});
