import type { AttendanceData } from '@school/trpc';
/**
 * 달력 형태의 출석부 데이터 훅
 */
export declare function useCalendar(groupId: string, year: number, month: number): {
    data: import("@school/trpc").GetCalendarOutput | undefined;
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
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
            res: import("express").Response<any, Record<string, any>>;
        };
        _input_in: {
            groupId: string;
            month: number;
            year: number;
        };
        _input_out: {
            groupId: string;
            month: number;
            year: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetCalendarOutput>> | null;
    refreshCalendar: () => Promise<void>;
    updateAttendance: (attendanceData: AttendanceData[], isFull: boolean) => Promise<import("@school/trpc").UpdateAttendanceOutput>;
    isUpdating: boolean;
};
/**
 * 날짜별 출석 상세 조회 훅 (모달용)
 */
export declare function useDayDetail(groupId: string, date: string, enabled?: boolean): {
    data: import("@school/trpc").GetDayDetailOutput | undefined;
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
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
            res: import("express").Response<any, Record<string, any>>;
        };
        _input_in: {
            groupId: string;
            date: string;
        };
        _input_out: {
            groupId: string;
            date: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetDayDetailOutput>> | null;
    refetch: <TPageData>(options?: (import("@tanstack/react-query").RefetchOptions & import("@tanstack/react-query").RefetchQueryFilters<TPageData>) | undefined) => Promise<import("@tanstack/react-query").QueryObserverResult<import("@school/trpc").GetDayDetailOutput, import("@trpc/client").TRPCClientErrorLike<import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("@school/trpc").Context;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
        }>;
        _meta: object;
        _ctx_out: {
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
            res: import("express").Response<any, Record<string, any>>;
        };
        _input_in: {
            groupId: string;
            date: string;
        };
        _input_out: {
            groupId: string;
            date: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetDayDetailOutput>>>>;
    refreshDayDetail: () => Promise<void>;
};
/**
 * 의무축일 데이터 훅
 */
export declare function useHolydays(year: number): {
    holydays: import("@school/trpc").Holyday[];
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
            account: import("@school/trpc").AccountInfo;
            req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
            res: import("express").Response<any, Record<string, any>>;
        };
        _input_in: {
            year: number;
        };
        _input_out: {
            year: number;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetHolydaysOutput>> | null;
};
