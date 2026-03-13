/**
 * Zod 스키마 모듈
 *
 * 도메인별 스키마와 공통 스키마를 export
 */

// 공통 스키마
export { idSchema, pageSchema, searchOptionSchema, searchWordSchema } from './common.js';

// ============================================================
// 입력 스키마 및 타입 (Input)
// ============================================================

// Auth 스키마
export {
    loginInputSchema,
    checkIdInputSchema,
    signupInputSchema,
    resetPasswordInputSchema,
    restoreAccountInputSchema,
} from './auth.js';
export type { LoginInput, CheckIdInput, SignupInput, ResetPasswordInput, RestoreAccountInput } from './auth.js';

// Group 스키마
export {
    getGroupInputSchema,
    listGroupsInputSchema,
    createGroupInputSchema,
    updateGroupInputSchema,
    deleteGroupInputSchema,
    bulkDeleteGroupsInputSchema,
    getGroupAttendanceInputSchema,
    addStudentToGroupInputSchema,
    removeStudentFromGroupInputSchema,
    bulkAddStudentsToGroupInputSchema,
    bulkRemoveStudentsFromGroupInputSchema,
} from './group.js';
export type {
    GetGroupInput,
    ListGroupsInput,
    CreateGroupInput,
    UpdateGroupInput,
    DeleteGroupInput,
    BulkDeleteGroupsInput,
    GetGroupAttendanceInput,
    AddStudentToGroupInput,
    RemoveStudentFromGroupInput,
    BulkAddStudentsToGroupInput,
    BulkRemoveStudentsFromGroupInput,
} from './group.js';

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
    bulkCreateStudentsInputSchema,
    bulkRegisterStudentsInputSchema,
    bulkCancelRegistrationInputSchema,
    feastDayListInputSchema,
} from './student.js';
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
    BulkCreateStudentsInput,
    BulkRegisterStudentsInput,
    BulkCancelRegistrationInput,
    FeastDayListInput,
} from './student.js';

// Attendance 스키마
export { updateAttendanceInputSchema, getCalendarInputSchema, getDayDetailInputSchema } from './attendance.js';
export type { AttendanceData, UpdateAttendanceInput, GetCalendarInput, GetDayDetailInput } from './attendance.js';

// Statistics 스키마
export { getExcellentStudentsInputSchema, statisticsInputSchema, topStatisticsInputSchema } from './statistics.js';
export type { GetExcellentStudentsInput, StatisticsInput, TopStatisticsInput } from './statistics.js';

// Liturgical 스키마
export { getHolydaysInputSchema, getSeasonInputSchema } from './liturgical.js';
export type { GetHolydaysInput, GetSeasonInput } from './liturgical.js';

// Church 스키마
export { createChurchInputSchema, searchChurchesInputSchema } from './church.js';
export type { CreateChurchInput, SearchChurchesInput } from './church.js';

// Organization 스키마
export {
    listOrganizationsInputSchema,
    createOrganizationInputSchema,
    requestJoinInputSchema,
    approveJoinInputSchema,
    rejectJoinInputSchema,
    transferAdminInputSchema,
} from './organization.js';
export type {
    ListOrganizationsInput,
    CreateOrganizationInput,
    RequestJoinInput,
    ApproveJoinInput,
    RejectJoinInput,
    TransferAdminInput,
} from './organization.js';

// ============================================================
// 출력 타입 (Output)
// ============================================================

// Account 스키마
export { changePasswordInputSchema, updateProfileInputSchema, deleteAccountInputSchema } from './account.js';
export type { ChangePasswordInput, UpdateProfileInput, DeleteAccountInput } from './account.js';

// Auth 출력 타입
export type {
    LoginOutput,
    CheckIdOutput,
    SignupOutput,
    ResetPasswordOutput,
    RestoreAccountOutput,
    RefreshOutput,
    LogoutOutput,
} from './auth.js';

// Account 출력 타입
export type {
    GetAccountOutput,
    AgreePrivacyOutput,
    GetAccountCountOutput,
    ChangePasswordOutput,
    UpdateProfileOutput,
    DeleteAccountOutput,
} from './account.js';

// Group 출력 타입
export type {
    GroupOutput,
    CreateGroupOutput,
    GetGroupOutput,
    ListGroupsOutput,
    AttendanceItem,
    GetGroupAttendanceOutput,
    BulkDeleteGroupsOutput,
} from './group.js';

// Student 출력 타입
export type {
    StudentGroupItem,
    StudentBase,
    StudentWithGroup,
    ListStudentsOutput,
    GetStudentOutput,
    CreateStudentOutput,
    UpdateStudentOutput,
    DeleteStudentOutput,
    PromoteStudentsOutput,
    BulkCreateStudentsOutput,
    BulkDeleteStudentsOutput,
    RestoreStudentsOutput,
    GraduatedStudent,
    SkippedStudent,
    GraduateStudentsOutput,
    CancelGraduationOutput,
    FeastDayStudentItem,
    FeastDayListOutput,
    RegistrationSummary,
    BulkRegisterStudentsOutput,
    BulkCancelRegistrationOutput,
} from './student.js';

// Attendance 출력 타입
export type {
    UpdateAttendanceOutput,
    CalendarDayAttendance,
    CalendarDay,
    GetCalendarOutput,
    StudentAttendanceDetail,
    GetDayDetailOutput,
    HasAttendanceOutput,
} from './attendance.js';

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
} from './statistics.js';

// Liturgical 출력 타입
export type { Holyday, GetHolydaysOutput, GetSeasonOutput } from './liturgical.js';

// Parish 출력 타입
export type { ParishItem, ListParishesOutput } from './parish.js';

// Church 출력 타입
export type { CreateChurchOutput, SearchChurchItem, SearchChurchesOutput } from './church.js';

// Organization 출력 타입
export type {
    OrganizationItem,
    ListOrganizationsOutput,
    CreateOrganizationOutput,
    RequestJoinOutput,
    PendingRequestItem,
    PendingRequestsOutput,
    MemberItem,
    MembersOutput,
    TransferAdminOutput,
} from './organization.js';
