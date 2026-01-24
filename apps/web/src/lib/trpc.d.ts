import superjson from 'superjson';
export declare const trpc: import("node_modules/@trpc/react-query/dist/createTRPCReact").CreateTRPCReactBase<import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("@school/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof superjson;
}>, {
    health: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        check: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: import("@school/trpc").Context;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            status: string;
        }>;
    }>;
    auth: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        login: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: import("@school/trpc").Context;
            _input_in: {
                name: string;
                password: string;
            };
            _input_out: {
                name: string;
                password: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").LoginOutput>;
    }>;
    account: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetAccountOutput>;
    }>;
    group: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListGroupsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetGroupOutput>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
            };
            _input_out: {
                name: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
                id: string;
            };
            _input_out: {
                name: string;
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteGroupsOutput>;
        attendance: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetGroupAttendanceOutput>;
    }>;
    student: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                page?: number | undefined;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _input_out: {
                page: number;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListStudentsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteStudentsOutput>;
        restore: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").RestoreStudentsOutput>;
        graduate: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GraduateStudentsOutput>;
        cancelGraduation: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").CancelGraduationOutput>;
        promote: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").PromoteStudentsOutput>;
    }>;
    attendance: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _input_out: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").UpdateAttendanceOutput>;
        calendar: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                year: number;
                month: number;
            };
            _input_out: {
                groupId: string;
                year: number;
                month: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetCalendarOutput>;
        dayDetail: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetDayDetailOutput>;
    }>;
    statistics: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        excellent: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetExcellentStudentsOutput>;
        weekly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        monthly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        yearly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        byGender: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GenderDistributionOutput>;
        topGroups: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopGroupsOutput>;
        topOverall: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopOverallOutput>;
        groupStatistics: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupStatisticsOutput>;
    }>;
    liturgical: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        holydays: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetHolydaysOutput>;
    }>;
}>, unknown> & import("@trpc/react-query/shared").DecoratedProcedureRecord<{
    health: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        check: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: import("@school/trpc").Context;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            status: string;
        }>;
    }>;
    auth: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        login: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: import("@school/trpc").Context;
            _input_in: {
                name: string;
                password: string;
            };
            _input_out: {
                name: string;
                password: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").LoginOutput>;
    }>;
    account: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetAccountOutput>;
    }>;
    group: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListGroupsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetGroupOutput>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
            };
            _input_out: {
                name: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
                id: string;
            };
            _input_out: {
                name: string;
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteGroupsOutput>;
        attendance: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetGroupAttendanceOutput>;
    }>;
    student: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                page?: number | undefined;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _input_out: {
                page: number;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListStudentsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteStudentsOutput>;
        restore: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").RestoreStudentsOutput>;
        graduate: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GraduateStudentsOutput>;
        cancelGraduation: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").CancelGraduationOutput>;
        promote: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").PromoteStudentsOutput>;
    }>;
    attendance: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _input_out: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").UpdateAttendanceOutput>;
        calendar: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                year: number;
                month: number;
            };
            _input_out: {
                groupId: string;
                year: number;
                month: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetCalendarOutput>;
        dayDetail: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetDayDetailOutput>;
    }>;
    statistics: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        excellent: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetExcellentStudentsOutput>;
        weekly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        monthly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        yearly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        byGender: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GenderDistributionOutput>;
        topGroups: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopGroupsOutput>;
        topOverall: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopOverallOutput>;
        groupStatistics: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupStatisticsOutput>;
    }>;
    liturgical: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        holydays: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetHolydaysOutput>;
    }>;
}, null, "">;
export declare const trpcClient: import("@trpc/client").TRPCClient<import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("@school/trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof superjson;
}>, {
    health: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        check: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: import("@school/trpc").Context;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            status: string;
        }>;
    }>;
    auth: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        login: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: import("@school/trpc").Context;
            _input_in: {
                name: string;
                password: string;
            };
            _input_out: {
                name: string;
                password: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").LoginOutput>;
    }>;
    account: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetAccountOutput>;
    }>;
    group: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListGroupsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetGroupOutput>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
            };
            _input_out: {
                name: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                name: string;
                id: string;
            };
            _input_out: {
                name: string;
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupOutput>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteGroupsOutput>;
        attendance: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetGroupAttendanceOutput>;
    }>;
    student: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        list: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                page?: number | undefined;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _input_out: {
                page: number;
                searchOption?: string | undefined;
                searchWord?: string | undefined;
                includeDeleted?: boolean | undefined;
                onlyDeleted?: boolean | undefined;
                graduated?: boolean | null | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").ListStudentsOutput>;
        get: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _input_out: {
                id: string;
                groupId: string;
                societyName: string;
                description?: string | undefined;
                catholicName?: string | undefined;
                age?: number | undefined;
                contact?: number | undefined;
                baptizedAt?: string | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").StudentBase>;
        bulkDelete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").BulkDeleteStudentsOutput>;
        restore: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").RestoreStudentsOutput>;
        graduate: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GraduateStudentsOutput>;
        cancelGraduation: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                ids: string[];
            };
            _input_out: {
                ids: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").CancelGraduationOutput>;
        promote: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").PromoteStudentsOutput>;
    }>;
    attendance: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        update: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _input_out: {
                year: number;
                attendance: {
                    data: string;
                    id: string;
                    month: number;
                    day: number;
                }[];
                isFull: boolean;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").UpdateAttendanceOutput>;
        calendar: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                groupId: string;
                year: number;
                month: number;
            };
            _input_out: {
                groupId: string;
                year: number;
                month: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetCalendarOutput>;
        dayDetail: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetDayDetailOutput>;
    }>;
    statistics: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        excellent: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GetExcellentStudentsOutput>;
        weekly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        monthly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        yearly: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").AttendanceRateOutput>;
        byGender: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GenderDistributionOutput>;
        topGroups: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopGroupsOutput>;
        topOverall: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                limit: number;
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").TopOverallOutput>;
        groupStatistics: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: {
                account: import("@school/trpc").AccountInfo;
                req: import("express").Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
                res: import("express").Response<any, Record<string, any>>;
            };
            _input_in: {
                year?: number | undefined;
            };
            _input_out: {
                year?: number | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@school/trpc").GroupStatisticsOutput>;
    }>;
    liturgical: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: import("@school/trpc").Context;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        holydays: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: import("@school/trpc").Context;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
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
        }, import("@school/trpc").GetHolydaysOutput>;
    }>;
}>>;
