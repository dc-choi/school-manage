/**
 * Student tRPC 라우터
 *
 * 학생 관련 procedure 정의
 */
import { BulkDeleteStudentsUseCase } from '../application/bulk-delete-students.usecase.ts';
import { CancelGraduationUseCase } from '../application/cancel-graduation.usecase.ts';
import { CreateStudentUseCase } from '../application/create-student.usecase.ts';
import { DeleteStudentUseCase } from '../application/delete-student.usecase.ts';
import { GetStudentUseCase } from '../application/get-student.usecase.ts';
import { GraduateStudentsUseCase } from '../application/graduate-students.usecase.ts';
import { ListStudentsUseCase } from '../application/list-students.usecase.ts';
import { PromoteStudentsUseCase } from '../application/promote-students.usecase.ts';
import { RestoreStudentsUseCase } from '../application/restore-students.usecase.ts';
import { UpdateStudentUseCase } from '../application/update-student.usecase.ts';
import {
    bulkDeleteStudentsInputSchema,
    cancelGraduationInputSchema,
    consentedProcedure,
    createStudentInputSchema,
    deleteStudentInputSchema,
    getStudentInputSchema,
    graduateStudentsInputSchema,
    listStudentsInputSchema,
    restoreStudentsInputSchema,
    router,
    updateStudentInputSchema,
} from '@school/trpc';

export const studentRouter = router({
    /**
     * 학생 목록 조회 (페이지네이션, 검색, 삭제 필터)
     * GET /api/student -> trpc.student.list
     */
    list: consentedProcedure.input(listStudentsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new ListStudentsUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            page: input.page,
            searchOption: input.searchOption,
            searchWord: input.searchWord,
            includeDeleted: input.includeDeleted,
            onlyDeleted: input.onlyDeleted,
            graduated: input.graduated,
        });
    }),

    /**
     * 단일 학생 조회
     * GET /api/student/:studentId -> trpc.student.get
     */
    get: consentedProcedure.input(getStudentInputSchema).query(async ({ input }) => {
        const usecase = new GetStudentUseCase();
        return usecase.execute(input);
    }),

    /**
     * 학생 생성
     * POST /api/student -> trpc.student.create
     */
    create: consentedProcedure.input(createStudentInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CreateStudentUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 학생 수정
     * PUT /api/student/:studentId -> trpc.student.update
     */
    update: consentedProcedure.input(updateStudentInputSchema).mutation(async ({ input }) => {
        const usecase = new UpdateStudentUseCase();
        return usecase.execute(input);
    }),

    /**
     * 학생 삭제
     * DELETE /api/student/:studentId -> trpc.student.delete
     */
    delete: consentedProcedure.input(deleteStudentInputSchema).mutation(async ({ input }) => {
        const usecase = new DeleteStudentUseCase();
        return usecase.execute(input);
    }),

    /**
     * 학생 일괄 삭제 (로드맵 1단계)
     * POST /api/student/bulk-delete -> trpc.student.bulkDelete
     */
    bulkDelete: consentedProcedure.input(bulkDeleteStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new BulkDeleteStudentsUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 학생 복구 (로드맵 1단계)
     * POST /api/student/restore -> trpc.student.restore
     */
    restore: consentedProcedure.input(restoreStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new RestoreStudentsUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 학생 일괄 졸업 처리 (graduatedAt 설정)
     * POST /api/student/graduate -> trpc.student.graduate
     */
    graduate: consentedProcedure.input(graduateStudentsInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new GraduateStudentsUseCase();
        return usecase.execute({
            ids: input.ids,
            accountId: ctx.account.id,
        });
    }),

    /**
     * 학생 졸업 취소 (graduatedAt을 null로)
     * POST /api/student/cancelGraduation -> trpc.student.cancelGraduation
     */
    cancelGraduation: consentedProcedure.input(cancelGraduationInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new CancelGraduationUseCase();
        return usecase.execute({
            ids: input.ids,
            accountId: ctx.account.id,
        });
    }),

    /**
     * TODO: 학생 데이터 이관 (추후 구현 예정)
     *
     * 현재: 단일 계정 내 그룹 이동
     * 향후: 본당 내 계정 간 졸업생 데이터 이관 (예: 초등부 → 중고등부)
     */
    promote: consentedProcedure.mutation(async ({ ctx }) => {
        const usecase = new PromoteStudentsUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            accountName: ctx.account.name,
        });
    }),
});
