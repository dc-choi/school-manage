/**
 * Student tRPC 라우터
 *
 * 학생 관련 procedure 정의
 */
import { BulkCancelRegistrationUseCase } from '../application/bulk-cancel-registration.usecase.ts';
import { BulkCreateStudentsUseCase } from '../application/bulk-create-students.usecase.ts';
import { BulkDeleteStudentsUseCase } from '../application/bulk-delete-students.usecase.ts';
import { BulkRegisterStudentsUseCase } from '../application/bulk-register-students.usecase.ts';
import { CancelGraduationUseCase } from '../application/cancel-graduation.usecase.ts';
import { CreateStudentUseCase } from '../application/create-student.usecase.ts';
import { DeleteStudentUseCase } from '../application/delete-student.usecase.ts';
import { GetFeastDayListUseCase } from '../application/get-feast-day-list.usecase.ts';
import { GetStudentUseCase } from '../application/get-student.usecase.ts';
import { GraduateStudentsUseCase } from '../application/graduate-students.usecase.ts';
import { ListStudentsUseCase } from '../application/list-students.usecase.ts';
import { PromoteStudentsUseCase } from '../application/promote-students.usecase.ts';
import { RestoreStudentsUseCase } from '../application/restore-students.usecase.ts';
import { UpdateStudentUseCase } from '../application/update-student.usecase.ts';
import {
    bulkCancelRegistrationInputSchema,
    bulkCreateStudentsInputSchema,
    bulkDeleteStudentsInputSchema,
    bulkRegisterStudentsInputSchema,
    cancelGraduationInputSchema,
    createStudentInputSchema,
    deleteStudentInputSchema,
    feastDayListInputSchema,
    getStudentInputSchema,
    graduateStudentsInputSchema,
    listStudentsInputSchema,
    restoreStudentsInputSchema,
    updateStudentInputSchema,
} from '@school/shared';
import { router, scopedProcedure } from '@school/trpc';

export const studentRouter = router({
    /**
     * 학생 목록 조회 (페이지네이션, 검색, 삭제 필터)
     * GET /api/student -> trpc.student.list
     */
    list: scopedProcedure.input(listStudentsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new ListStudentsUseCase();
        return usecase.execute({
            organizationId: ctx.organization.id,
            page: input.page,
            searchOption: input.searchOption,
            searchWord: input.searchWord,
            includeDeleted: input.includeDeleted,
            onlyDeleted: input.onlyDeleted,
            graduated: input.graduated,
            registered: input.registered,
            registrationYear: input.registrationYear,
        });
    }),

    /**
     * 축일자 목록 조회 (지정 월에 축일이 있는 재학생)
     * GET /api/student/feastDayList -> trpc.student.feastDayList
     */
    feastDayList: scopedProcedure.input(feastDayListInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetFeastDayListUseCase();
        return usecase.execute({ month: input.month, organizationId: ctx.organization.id });
    }),

    /**
     * 단일 학생 조회
     * GET /api/student/:studentId -> trpc.student.get
     */
    get: scopedProcedure.input(getStudentInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetStudentUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 생성
     * POST /api/student -> trpc.student.create
     */
    create: scopedProcedure.input(createStudentInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CreateStudentUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 수정
     * PUT /api/student/:studentId -> trpc.student.update
     */
    update: scopedProcedure.input(updateStudentInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new UpdateStudentUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 삭제
     * DELETE /api/student/:studentId -> trpc.student.delete
     */
    delete: scopedProcedure.input(deleteStudentInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new DeleteStudentUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 일괄 등록 (로드맵 2단계 — 엑셀 Import)
     * POST /api/student/bulk-create -> trpc.student.bulkCreate
     */
    bulkCreate: scopedProcedure.input(bulkCreateStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkCreateStudentsUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 일괄 삭제 (로드맵 1단계)
     * POST /api/student/bulk-delete -> trpc.student.bulkDelete
     */
    bulkDelete: scopedProcedure.input(bulkDeleteStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkDeleteStudentsUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 복구 (로드맵 1단계)
     * POST /api/student/restore -> trpc.student.restore
     */
    restore: scopedProcedure.input(restoreStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RestoreStudentsUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 일괄 졸업 처리 (graduatedAt 설정)
     * POST /api/student/graduate -> trpc.student.graduate
     */
    graduate: scopedProcedure.input(graduateStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new GraduateStudentsUseCase();
        return usecase.execute({
            ids: input.ids,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 학생 졸업 취소 (graduatedAt을 null로)
     * POST /api/student/cancelGraduation -> trpc.student.cancelGraduation
     */
    cancelGraduation: scopedProcedure.input(cancelGraduationInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CancelGraduationUseCase();
        return usecase.execute({
            ids: input.ids,
            organizationId: ctx.organization.id,
        });
    }),

    /**
     * 학생 일괄 등록 (로드맵 2단계 — 등록 관리)
     * POST /api/student/bulk-register -> trpc.student.bulkRegister
     */
    bulkRegister: scopedProcedure.input(bulkRegisterStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkRegisterStudentsUseCase();
        return usecase.execute(input, ctx.organization.id);
    }),

    /**
     * 학생 일괄 등록 취소 (로드맵 2단계 — 등록 관리)
     * POST /api/student/bulk-cancel-registration -> trpc.student.bulkCancelRegistration
     */
    bulkCancelRegistration: scopedProcedure
        .input(bulkCancelRegistrationInputSchema)
        .mutation(async ({ input, ctx }) => {
            const usecase = new BulkCancelRegistrationUseCase();
            return usecase.execute(input, ctx.organization.id);
        }),

    /**
     * TODO: 학생 데이터 이관 (추후 구현 예정)
     *
     * 현재: 단일 계정 내 그룹 이동
     * 향후: 본당 내 계정 간 졸업생 데이터 이관 (예: 초등부 → 중고등부)
     */
    promote: scopedProcedure.mutation(async ({ ctx }) => {
        const usecase = new PromoteStudentsUseCase();
        return usecase.execute({
            organizationId: ctx.organization.id,
            organizationName: ctx.organization.name,
        });
    }),
});
