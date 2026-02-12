/**
 * Zod 스키마 모듈
 *
 * 도메인별 스키마와 공통 스키마를 export
 */

// 공통 스키마
export { idSchema, pageSchema, searchOptionSchema, searchWordSchema } from './common';

// ============================================================
// 입력 스키마 및 타입 (Input)
// ============================================================

// Auth 스키마
export { loginInputSchema, checkIdInputSchema, signupInputSchema } from './auth';
export type { LoginInput, CheckIdInput, SignupInput } from './auth';

// Group 스키마
export {
    getGroupInputSchema,
    createGroupInputSchema,
    updateGroupInputSchema,
    deleteGroupInputSchema,
    bulkDeleteGroupsInputSchema,
    getGroupAttendanceInputSchema,
} from './group';
export type {
    GetGroupInput,
    CreateGroupInput,
    UpdateGroupInput,
    DeleteGroupInput,
    BulkDeleteGroupsInput,
    GetGroupAttendanceInput,
} from './group';

// Student 스키마
export {
    listStudentsInputSchema,
    getStudentInputSchema,
    createStudentInputSchema,
    updateStudentInputSchema,
    deleteStudentInputSchema,
    bulkDeleteStudentsInputSchema,
    restoreStudentsInputSchema,
    graduateStudentsInputSchema,
    cancelGraduationInputSchema,
} from './student';
export type {
    ListStudentsInput,
    GetStudentInput,
    CreateStudentInput,
    UpdateStudentInput,
    DeleteStudentInput,
    BulkDeleteStudentsInput,
    RestoreStudentsInput,
    GraduateStudentsInput,
    CancelGraduationInput,
} from './student';

// Attendance 스키마
export { updateAttendanceInputSchema, getCalendarInputSchema, getDayDetailInputSchema } from './attendance';
export type { AttendanceData, UpdateAttendanceInput, GetCalendarInput, GetDayDetailInput } from './attendance';

// Statistics 스키마
export { getExcellentStudentsInputSchema, statisticsInputSchema, topStatisticsInputSchema } from './statistics';
export type { GetExcellentStudentsInput, StatisticsInput, TopStatisticsInput } from './statistics';

// Liturgical 스키마
export { getHolydaysInputSchema } from './liturgical';
export type { GetHolydaysInput } from './liturgical';

// ============================================================
// 출력 타입 (Output)
// ============================================================

// Auth 출력 타입
export type { LoginOutput, CheckIdOutput, SignupOutput } from './auth';

// Account 출력 타입
export type { GetAccountOutput, GetAccountCountOutput } from './account';

// Group 출력 타입
export type {
    GroupOutput,
    CreateGroupOutput,
    GetGroupOutput,
    ListGroupsOutput,
    AttendanceItem,
    GetGroupAttendanceOutput,
    BulkDeleteGroupsOutput,
} from './group';

// Student 출력 타입
export type {
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
} from './student';

// Attendance 출력 타입
export type {
    UpdateAttendanceOutput,
    CalendarDayAttendance,
    CalendarDay,
    GetCalendarOutput,
    StudentAttendanceDetail,
    GetDayDetailOutput,
} from './attendance';

// Statistics 출력 타입
export type {
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
} from './statistics';

// Liturgical 출력 타입
export type { Holyday, GetHolydaysOutput } from './liturgical';
