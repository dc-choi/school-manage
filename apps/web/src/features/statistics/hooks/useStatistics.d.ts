export declare function useStatistics(year?: number): {
    excellentStudents: import("@school/trpc").ExcellentStudent[];
    isLoading: boolean;
    error: import("@trpc/client").TRPCClientErrorLike<import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("@school/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            res: import("express").Response<any, Record<string, any>>;
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        };
        _input_in: {
            year?: number | undefined;
        };
        _input_out: {
            year?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetExcellentStudentsOutput>> | null;
};
/**
 * 대시보드 통계 훅
 * 주간/월간/연간 출석률, 성별 분포, TOP 그룹/학생 조회
 * 평균 출석 인원은 weekly/monthly/yearly의 avgAttendance 필드에서 추출
 */
export declare function useDashboardStatistics(year?: number): {
    weekly: import("@school/trpc").AttendanceRateOutput | undefined;
    monthly: import("@school/trpc").AttendanceRateOutput | undefined;
    yearly: import("@school/trpc").AttendanceRateOutput | undefined;
    byGender: import("@school/trpc").GenderDistributionOutput | undefined;
    topGroups: import("@school/trpc").TopGroupsOutput | undefined;
    topOverall: import("@school/trpc").TopOverallOutput | undefined;
    groupStatistics: import("@school/trpc").GroupStatisticsOutput | undefined;
    isLoading: boolean;
    error: import("@trpc/client").TRPCClientErrorLike<import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("@school/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            res: import("express").Response<any, Record<string, any>>;
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        };
        _input_in: {
            year?: number | undefined;
        };
        _input_out: {
            year?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").AttendanceRateOutput>> | null;
};
