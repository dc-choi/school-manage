/**
 * @school/trpc - 공용 tRPC 패키지
 *
 * 서버/클라이언트가 공유하는 타입과 라우터 정의
 */

// Context 타입
export type { Context, AuthContext, BaseContext } from './context';

// 공통 타입
export type { AccountInfo } from './shared';

// AppRouter 타입 (클라이언트용)
export type { AppRouter } from './routers';

// tRPC 유틸리티
export { router, publicProcedure, protectedProcedure, middleware, transformer, createCallerFactory } from './trpc';

// Zod 스키마 (Input)
export {
    idSchema,
    pageSchema,
    searchOptionSchema,
    searchWordSchema,
    loginInputSchema,
    getGroupInputSchema,
    createGroupInputSchema,
    updateGroupInputSchema,
    deleteGroupInputSchema,
    bulkDeleteGroupsInputSchema,
    getGroupAttendanceInputSchema,
    listStudentsInputSchema,
    getStudentInputSchema,
    createStudentInputSchema,
    updateStudentInputSchema,
    deleteStudentInputSchema,
    bulkDeleteStudentsInputSchema,
    restoreStudentsInputSchema,
    graduateStudentsInputSchema,
    cancelGraduationInputSchema,
    updateAttendanceInputSchema,
    getCalendarInputSchema,
    getDayDetailInputSchema,
    getExcellentStudentsInputSchema,
    statisticsInputSchema,
    topStatisticsInputSchema,
    getHolydaysInputSchema,
} from './schemas';

// 입력 타입 (Input)
export type {
    LoginInput,
    GetGroupInput,
    CreateGroupInput,
    UpdateGroupInput,
    DeleteGroupInput,
    BulkDeleteGroupsInput,
    GetGroupAttendanceInput,
    ListStudentsInput,
    GetStudentInput,
    CreateStudentInput,
    UpdateStudentInput,
    DeleteStudentInput,
    BulkDeleteStudentsInput,
    RestoreStudentsInput,
    GraduateStudentsInput,
    CancelGraduationInput,
    AttendanceData,
    UpdateAttendanceInput,
    GetCalendarInput,
    GetDayDetailInput,
    GetExcellentStudentsInput,
    StatisticsInput,
    TopStatisticsInput,
    GetHolydaysInput,
} from './schemas';

// 출력 타입 (Output)
export type {
    // Auth
    LoginOutput,
    // Account
    GetAccountOutput,
    // Group
    GroupOutput,
    GetGroupOutput,
    ListGroupsOutput,
    AttendanceItem,
    GetGroupAttendanceOutput,
    BulkDeleteGroupsOutput,
    // Student
    StudentBase,
    StudentWithGroup,
    ListStudentsOutput,
    GetStudentOutput,
    CreateStudentOutput,
    UpdateStudentOutput,
    DeleteStudentOutput,
    PromoteStudentsOutput,
    BulkDeleteStudentsOutput,
    RestoreStudentsOutput,
    GraduatedStudent,
    GraduateStudentsOutput,
    CancelGraduationOutput,
    // Attendance
    UpdateAttendanceOutput,
    CalendarDayAttendance,
    CalendarDay,
    GetCalendarOutput,
    StudentAttendanceDetail,
    GetDayDetailOutput,
    // Statistics
    ExcellentStudent,
    GetExcellentStudentsOutput,
    AttendanceRateOutput,
    GenderDistributionOutput,
    TopGroupItem,
    TopGroupsOutput,
    TopOverallStudentItem,
    TopOverallOutput,
    GroupStatisticsItem,
    GroupStatisticsOutput,
    // Liturgical
    Holyday,
    GetHolydaysOutput,
} from './schemas';
