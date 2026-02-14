/**
 * Statistics tRPC 라우터
 *
 * 통계 관련 procedure 정의
 */
import { GetAttendanceRateUseCase } from '../application/get-attendance-rate.usecase.ts';
import { GetByGenderUseCase } from '../application/get-by-gender.usecase.ts';
import { GetExcellentStudentsUseCase } from '../application/get-excellent-students.usecase.ts';
import { GetGroupStatisticsUseCase } from '../application/get-group-statistics.usecase.ts';
import { GetTopGroupsUseCase } from '../application/get-top-groups.usecase.ts';
import { GetTopOverallUseCase } from '../application/get-top-overall.usecase.ts';
import {
    consentedProcedure,
    getExcellentStudentsInputSchema,
    router,
    statisticsInputSchema,
    topStatisticsInputSchema,
} from '@school/trpc';

export const statisticsRouter = router({
    /**
     * 우수 출석 학생 조회
     */
    excellent: consentedProcedure.input(getExcellentStudentsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetExcellentStudentsUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            year: input.year,
        });
    }),

    /**
     * 주간 출석률 + 평균 출석 인원 조회
     */
    weekly: consentedProcedure.input(statisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetAttendanceRateUseCase();
        return usecase.execute(
            {
                accountId: ctx.account.id,
                year: input.year,
                month: input.month,
                week: input.week,
            },
            'weekly'
        );
    }),

    /**
     * 월간 출석률 + 평균 출석 인원 조회
     */
    monthly: consentedProcedure.input(statisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetAttendanceRateUseCase();
        return usecase.execute(
            {
                accountId: ctx.account.id,
                year: input.year,
                month: input.month,
                week: input.week,
            },
            'monthly'
        );
    }),

    /**
     * 연간 출석률 + 평균 출석 인원 조회
     */
    yearly: consentedProcedure.input(statisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetAttendanceRateUseCase();
        return usecase.execute(
            {
                accountId: ctx.account.id,
                year: input.year,
                month: input.month,
                week: input.week,
            },
            'yearly'
        );
    }),

    /**
     * 성별 분포 조회
     */
    byGender: consentedProcedure.input(statisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetByGenderUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            year: input.year,
            month: input.month,
            week: input.week,
        });
    }),

    /**
     * 그룹별 출석률 순위 TOP N
     */
    topGroups: consentedProcedure.input(topStatisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetTopGroupsUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            year: input.year,
            month: input.month,
            week: input.week,
            limit: input.limit,
        });
    }),

    /**
     * 전체 우수 학생 TOP N
     */
    topOverall: consentedProcedure.input(topStatisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetTopOverallUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            year: input.year,
            month: input.month,
            week: input.week,
            limit: input.limit,
        });
    }),

    /**
     * 그룹별 상세 통계 (주간/월간/연간 출석률 + 평균 출석 인원)
     */
    groupStatistics: consentedProcedure.input(statisticsInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetGroupStatisticsUseCase();
        return usecase.execute({
            accountId: ctx.account.id,
            year: input.year,
            month: input.month,
            week: input.week,
        });
    }),
});
