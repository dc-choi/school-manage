/**
 * Attendance tRPC 라우터
 *
 * 출석 관련 procedure 정의
 */
import { GetCalendarUseCase } from '../application/get-calendar.usecase.ts';
import { GetDayDetailUseCase } from '../application/get-day-detail.usecase.ts';
import { UpdateAttendanceUseCase } from '../application/update-attendance.usecase.ts';
import {
    consentedProcedure,
    getCalendarInputSchema,
    getDayDetailInputSchema,
    router,
    updateAttendanceInputSchema,
} from '@school/trpc';

export const attendanceRouter = router({
    /**
     * 출석 업데이트
     * PUT /api/attendance -> trpc.attendance.update
     */
    update: consentedProcedure.input(updateAttendanceInputSchema).mutation(async ({ input, ctx }) => {
        const usecase = new UpdateAttendanceUseCase();
        return usecase.execute(input, ctx.account.id);
    }),

    /**
     * 달력 데이터 조회 (월별 출석 현황 + 의무축일)
     * GET /api/attendance/calendar -> trpc.attendance.calendar
     */
    calendar: consentedProcedure.input(getCalendarInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetCalendarUseCase();
        return usecase.execute({
            year: input.year,
            month: input.month,
            groupId: input.groupId,
            accountId: ctx.account.id,
        });
    }),

    /**
     * 날짜별 출석 상세 조회 (모달용)
     * GET /api/attendance/day-detail -> trpc.attendance.dayDetail
     */
    dayDetail: consentedProcedure.input(getDayDetailInputSchema).query(async ({ input, ctx }) => {
        const usecase = new GetDayDetailUseCase();
        return usecase.execute({
            groupId: input.groupId,
            date: input.date,
            accountId: ctx.account.id,
        });
    }),
});
