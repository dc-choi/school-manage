/**
 * App Router - 모든 tRPC 라우터 병합
 *
 * 도메인별 라우터를 병합하여 단일 진입점 제공
 */
import { router } from '@school/trpc';
import { accountRouter } from '~/domains/account/presentation/account.router.js';
import { attendanceRouter } from '~/domains/attendance/presentation/attendance.router.js';
import { authRouter } from '~/domains/auth/presentation/auth.router.js';
import { groupRouter } from '~/domains/group/presentation/group.router.js';
import { liturgicalRouter } from '~/domains/liturgical/presentation/liturgical.router.js';
import { statisticsRouter } from '~/domains/statistics/presentation/statistics.router.js';
import { studentRouter } from '~/domains/student/presentation/student.router.js';
import { healthRouter } from '~/global/health.router.js';

/**
 * AppRouter - 모든 라우터의 단일 진입점
 */
export const appRouter = router({
    health: healthRouter,
    auth: authRouter,
    account: accountRouter,
    group: groupRouter,
    student: studentRouter,
    attendance: attendanceRouter,
    statistics: statisticsRouter,
    liturgical: liturgicalRouter,
});

/**
 * AppRouter 타입 (클라이언트에서 타입 추론에 사용)
 */
export type AppRouter = typeof appRouter;
