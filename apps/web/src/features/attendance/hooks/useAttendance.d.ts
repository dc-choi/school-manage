import type { AttendanceData } from '@school/trpc';
export declare function useAttendance(groupId: string, year?: number): {
    data: import("@school/trpc").GetGroupAttendanceOutput | undefined;
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
            year?: number | undefined;
        };
        _input_out: {
            groupId: string;
            year?: number | undefined;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetGroupAttendanceOutput>> | null;
    updateAttendance: (attendanceData: AttendanceData[], isFull: boolean) => Promise<import("@school/trpc").UpdateAttendanceOutput | undefined>;
    isUpdating: boolean;
};
