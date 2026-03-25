/**
 * Group tRPC 라우터
 *
 * 그룹 관련 procedure 정의
 */
import { AddStudentToGroupUseCase } from '../application/add-student-to-group.usecase.ts';
import { BulkAddStudentsToGroupUseCase } from '../application/bulk-add-students-to-group.usecase.ts';
import { BulkDeleteGroupsUseCase } from '../application/bulk-delete-groups.usecase.ts';
import { BulkRemoveStudentsFromGroupUseCase } from '../application/bulk-remove-students-from-group.usecase.ts';
import { CreateGroupUseCase } from '../application/create-group.usecase.ts';
import { DeleteGroupUseCase } from '../application/delete-group.usecase.ts';
import { GetGroupAttendanceUseCase } from '../application/get-group-attendance.usecase.ts';
import { GetGroupUseCase } from '../application/get-group.usecase.ts';
import { ListGroupsUseCase } from '../application/list-groups.usecase.ts';
import { RemoveStudentFromGroupUseCase } from '../application/remove-student-from-group.usecase.ts';
import { UpdateGroupUseCase } from '../application/update-group.usecase.ts';
import {
    addStudentToGroupInputSchema,
    bulkAddStudentsToGroupInputSchema,
    bulkDeleteGroupsInputSchema,
    bulkRemoveStudentsFromGroupInputSchema,
    createGroupInputSchema,
    deleteGroupInputSchema,
    getGroupAttendanceInputSchema,
    getGroupInputSchema,
    listGroupsInputSchema,
    removeStudentFromGroupInputSchema,
    updateGroupInputSchema,
} from '@school/shared';
import { router, scopedProcedure } from '@school/trpc';

export const groupRouter = router({
    /**
     * 그룹 목록 조회
     * GET /api/group -> trpc.group.list
     */
    list: scopedProcedure.input(listGroupsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new ListGroupsUseCase();
        return usecase.execute(ctx.organization.id, input.type);
    }),

    /**
     * 단일 그룹 조회
     * GET /api/group/:groupId -> trpc.group.get
     */
    get: scopedProcedure.input(getGroupInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetGroupUseCase();
        return usecase.execute({
            id: input.id,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 그룹 생성
     * POST /api/group -> trpc.group.create
     */
    create: scopedProcedure.input(createGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CreateGroupUseCase();
        return usecase.execute({
            name: input.name,
            type: input.type,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 그룹 수정
     * PUT /api/group/:groupId -> trpc.group.update
     */
    update: scopedProcedure.input(updateGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new UpdateGroupUseCase();
        return usecase.execute({
            id: input.id,
            name: input.name,
            type: input.type,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 그룹 삭제
     * DELETE /api/group/:groupId -> trpc.group.delete
     */
    delete: scopedProcedure.input(deleteGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new DeleteGroupUseCase();
        return usecase.execute({
            id: input.id,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 그룹 일괄 삭제 (로드맵 1단계)
     * POST /api/group/bulk-delete -> trpc.group.bulkDelete
     */
    bulkDelete: scopedProcedure.input(bulkDeleteGroupsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkDeleteGroupsUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 그룹에 학생 추가
     * POST /api/group/addStudent -> trpc.group.addStudent
     */
    addStudent: scopedProcedure.input(addStudentToGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new AddStudentToGroupUseCase();
        return usecase.execute({ ...input, organizationId: ctx.organization.id });
    }),

    /**
     * 그룹에서 학생 제거
     * POST /api/group/removeStudent -> trpc.group.removeStudent
     */
    removeStudent: scopedProcedure.input(removeStudentFromGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RemoveStudentFromGroupUseCase();
        return usecase.execute({ ...input, organizationId: ctx.organization.id });
    }),

    /**
     * 그룹에 학생 일괄 추가
     * POST /api/group/bulkAddStudents -> trpc.group.bulkAddStudents
     */
    bulkAddStudents: scopedProcedure.input(bulkAddStudentsToGroupInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkAddStudentsToGroupUseCase();
        return usecase.execute({ ...input, organizationId: ctx.organization.id });
    }),

    /**
     * 그룹에서 학생 일괄 제거
     * POST /api/group/bulkRemoveStudents -> trpc.group.bulkRemoveStudents
     */
    bulkRemoveStudents: scopedProcedure
        .input(bulkRemoveStudentsFromGroupInputSchema)
        .mutation(async ({ input, ctx }) => {
            const usecase = new BulkRemoveStudentsFromGroupUseCase();
            return usecase.execute({ ...input, organizationId: ctx.organization.id });
        }),

    /**
     * 그룹별 출석 조회
     * GET /api/group/:groupId/attendance -> trpc.group.attendance
     */
    attendance: scopedProcedure.input(getGroupAttendanceInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetGroupAttendanceUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),
});
