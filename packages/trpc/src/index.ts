/**
 * @school/trpc - 공용 tRPC 패키지
 *
 * 서버/클라이언트가 공유하는 타입과 라우터 정의
 */

// Context 타입
export type { Context, AuthContext, ScopedContext, BaseContext } from './context.js';

// 공통 타입 + 상수
export { ROLE, JOIN_REQUEST_STATUS, GENDER, PRESENT_MARKS } from './shared.js';
export type { AccountInfo, OrganizationInfo, ChurchInfo, Role, JoinRequestStatus, Gender } from './shared.js';

// AppRouter 타입 (클라이언트용)
export type { AppRouter } from './routers/index.js';

// tRPC 유틸리티
export {
    router,
    publicProcedure,
    protectedProcedure,
    consentedProcedure,
    scopedProcedure,
    middleware,
    transformer,
    createCallerFactory,
} from './trpc.js';

// Zod 스키마 (Input)
export {
    idSchema,
    pageSchema,
    searchOptionSchema,
    searchWordSchema,
    loginInputSchema,
    checkIdInputSchema,
    signupInputSchema,
    resetPasswordInputSchema,
    restoreAccountInputSchema,
    changePasswordInputSchema,
    updateProfileInputSchema,
    deleteAccountInputSchema,
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
    bulkCreateStudentsInputSchema,
    bulkRegisterStudentsInputSchema,
    bulkCancelRegistrationInputSchema,
    feastDayListInputSchema,
    updateAttendanceInputSchema,
    getCalendarInputSchema,
    getDayDetailInputSchema,
    getExcellentStudentsInputSchema,
    statisticsInputSchema,
    topStatisticsInputSchema,
    getHolydaysInputSchema,
    getSeasonInputSchema,
    createChurchInputSchema,
    searchChurchesInputSchema,
    listOrganizationsInputSchema,
    createOrganizationInputSchema,
    requestJoinInputSchema,
    approveJoinInputSchema,
    rejectJoinInputSchema,
} from './schemas/index.js';

// 입력 타입 (Input)
export type {
    LoginInput,
    CheckIdInput,
    SignupInput,
    ResetPasswordInput,
    RestoreAccountInput,
    ChangePasswordInput,
    UpdateProfileInput,
    DeleteAccountInput,
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
    BulkCreateStudentsInput,
    BulkRegisterStudentsInput,
    BulkCancelRegistrationInput,
    FeastDayListInput,
    AttendanceData,
    UpdateAttendanceInput,
    GetCalendarInput,
    GetDayDetailInput,
    GetExcellentStudentsInput,
    StatisticsInput,
    TopStatisticsInput,
    GetHolydaysInput,
    GetSeasonInput,
    CreateChurchInput,
    SearchChurchesInput,
    ListOrganizationsInput,
    CreateOrganizationInput,
    RequestJoinInput,
    ApproveJoinInput,
    RejectJoinInput,
} from './schemas/index.js';

// 출력 타입 (Output)
export type {
    // Auth
    LoginOutput,
    CheckIdOutput,
    SignupOutput,
    ResetPasswordOutput,
    RestoreAccountOutput,
    // Account
    GetAccountOutput,
    AgreePrivacyOutput,
    GetAccountCountOutput,
    ChangePasswordOutput,
    UpdateProfileOutput,
    DeleteAccountOutput,
    // Group
    GroupOutput,
    CreateGroupOutput,
    GetGroupOutput,
    ListGroupsOutput,
    AttendanceItem,
    GetGroupAttendanceOutput,
    BulkDeleteGroupsOutput,
    // Student
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
    GraduateStudentsOutput,
    CancelGraduationOutput,
    FeastDayStudentItem,
    FeastDayListOutput,
    RegistrationSummary,
    BulkRegisterStudentsOutput,
    BulkCancelRegistrationOutput,
    // Attendance
    UpdateAttendanceOutput,
    CalendarDayAttendance,
    CalendarDay,
    GetCalendarOutput,
    StudentAttendanceDetail,
    GetDayDetailOutput,
    HasAttendanceOutput,
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
    GetSeasonOutput,
    // Parish
    ParishItem,
    ListParishesOutput,
    // Church
    CreateChurchOutput,
    SearchChurchItem,
    SearchChurchesOutput,
    // Organization
    OrganizationItem,
    ListOrganizationsOutput,
    CreateOrganizationOutput,
    RequestJoinOutput,
    PendingRequestItem,
    PendingRequestsOutput,
    MemberItem,
    MembersOutput,
} from './schemas/index.js';
