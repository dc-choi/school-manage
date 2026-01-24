import type { CreateStudentInput, UpdateStudentInput } from '@school/trpc';
type DeleteFilter = 'active' | 'deleted' | 'all';
type GraduatedFilter = 'active' | 'graduated' | 'all';
interface UseStudentsOptions {
    initialPage?: number;
    searchOption?: 'all' | 'name' | 'catholicName';
    searchWord?: string;
    initialDeleteFilter?: DeleteFilter;
    initialGraduatedFilter?: GraduatedFilter;
}
export declare function useStudents(options?: UseStudentsOptions): {
    students: import("@school/trpc").StudentWithGroup[];
    totalPage: number;
    currentPage: number;
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
    }, import("@school/trpc").ListStudentsOutput>> | null;
    setPage: import("react").Dispatch<import("react").SetStateAction<number>>;
    search: (option: "all" | "name" | "catholicName", word: string) => void;
    searchOption: "all" | "name" | "catholicName";
    searchWord: string;
    deleteFilter: DeleteFilter;
    changeDeleteFilter: (filter: DeleteFilter) => void;
    graduatedFilter: GraduatedFilter;
    changeGraduatedFilter: (filter: GraduatedFilter) => void;
    create: (input: CreateStudentInput) => Promise<import("@school/trpc").StudentBase>;
    isCreating: boolean;
    update: (input: UpdateStudentInput) => Promise<import("@school/trpc").StudentBase>;
    isUpdating: boolean;
    delete: (id: string) => Promise<import("@school/trpc").StudentBase>;
    isDeleting: boolean;
    bulkDelete: (ids: string[]) => Promise<import("@school/trpc").BulkDeleteStudentsOutput>;
    isBulkDeleting: boolean;
    restore: (ids: string[]) => Promise<import("@school/trpc").RestoreStudentsOutput>;
    isRestoring: boolean;
    graduate: (ids: string[]) => Promise<import("@school/trpc").GraduateStudentsOutput>;
    isGraduating: boolean;
    cancelGraduation: (ids: string[]) => Promise<import("@school/trpc").CancelGraduationOutput>;
    isCancellingGraduation: boolean;
};
/**
 * 단일 학생 조회 훅
 */
export declare function useStudent(id: string): import("@trpc/react-query/shared").UseTRPCQueryResult<import("@school/trpc").StudentBase, import("@trpc/client").TRPCClientErrorLike<import("@trpc/server").BuildProcedure<"query", {
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
}, import("@school/trpc").StudentBase>>>;
export {};
