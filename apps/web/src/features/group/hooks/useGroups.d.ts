import type { CreateGroupInput, UpdateGroupInput } from '@school/trpc';
export declare function useGroups(): {
    groups: import("@school/trpc").GroupOutput[];
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
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").ListGroupsOutput>> | null;
    getQuery: (id: string) => import("@trpc/react-query/shared").UseTRPCQueryResult<import("@school/trpc").GetGroupOutput, import("@trpc/client").TRPCClientErrorLike<import("@trpc/server").BuildProcedure<"query", {
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
            id: string;
        };
        _input_out: {
            id: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, import("@school/trpc").GetGroupOutput>>>;
    create: (input: CreateGroupInput) => Promise<import("@school/trpc").GroupOutput>;
    isCreating: boolean;
    update: (input: UpdateGroupInput) => Promise<import("@school/trpc").GroupOutput>;
    isUpdating: boolean;
    delete: (id: string) => Promise<import("@school/trpc").GroupOutput>;
    isDeleting: boolean;
    bulkDelete: (ids: string[]) => Promise<import("@school/trpc").BulkDeleteGroupsOutput>;
    isBulkDeleting: boolean;
};
