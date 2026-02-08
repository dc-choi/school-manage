import type { CreateStudentInput, UpdateStudentInput } from '@school/trpc';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

type DeleteFilter = 'active' | 'deleted' | 'all';
type GraduatedFilter = 'active' | 'graduated' | 'all';

interface UseStudentsOptions {
    initialPage?: number;
    searchOption?: 'all' | 'societyName' | 'catholicName' | 'baptizedAt';
    searchWord?: string;
    initialDeleteFilter?: DeleteFilter;
    initialGraduatedFilter?: GraduatedFilter;
    syncPageWithUrl?: boolean;
}

const parsePageParam = (value: string | null): number => {
    const parsed = parseInt(value ?? '', 10);
    return parsed > 0 ? parsed : 1;
};

export function useStudents(options: UseStudentsOptions = {}) {
    const [searchParams, setSearchParams] = useSearchParams();

    const initialPage = options.syncPageWithUrl ? parsePageParam(searchParams.get('page')) : (options.initialPage ?? 1);

    const [page, setPageState] = useState(initialPage);

    const setPage = (newPage: number) => {
        setPageState(newPage);
        if (options.syncPageWithUrl) {
            setSearchParams(newPage > 1 ? { page: String(newPage) } : {}, { replace: true });
        }
    };
    const [searchOption, setSearchOption] = useState(options.searchOption ?? 'all');
    const [searchWord, setSearchWord] = useState(options.searchWord ?? '');
    const [deleteFilter, setDeleteFilter] = useState<DeleteFilter>(options.initialDeleteFilter ?? 'active');
    const [graduatedFilter, setGraduatedFilter] = useState<GraduatedFilter>(options.initialGraduatedFilter ?? 'active');

    const utils = trpc.useUtils();

    // 삭제 필터에 따른 includeDeleted/onlyDeleted 계산
    const getDeleteFilterParams = () => {
        switch (deleteFilter) {
            case 'deleted':
                return { onlyDeleted: true };
            case 'all':
                return { includeDeleted: true };
            default:
                return {}; // active: 기본값 (삭제되지 않은 학생만)
        }
    };

    // 졸업 필터에 따른 graduated 계산
    const getGraduatedFilterParams = () => {
        switch (graduatedFilter) {
            case 'graduated':
                return { graduated: true };
            case 'all':
                return { graduated: null };
            default:
                return { graduated: false }; // active: 재학생만
        }
    };

    const listQuery = trpc.student.list.useQuery({
        page,
        searchOption,
        searchWord,
        ...getDeleteFilterParams(),
        ...getGraduatedFilterParams(),
    });

    const createMutation = trpc.student.create.useMutation({
        onSuccess: (data) => {
            utils.student.list.invalidate();

            // GA4 이벤트: 첫 학생 등록
            if (data.isFirstStudent && data.daysSinceSignup !== undefined) {
                analytics.trackFirstStudentRegistered(data.daysSinceSignup);
            }

            // GA4 이벤트: 학생 등록
            analytics.trackStudentCreated();
        },
    });

    const updateMutation = trpc.student.update.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
            utils.student.get.invalidate();

            // GA4 이벤트: 학생 수정
            analytics.trackStudentUpdated();
        },
    });

    const deleteMutation = trpc.student.delete.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();

            // GA4 이벤트: 학생 삭제
            analytics.trackStudentDeleted(1);
        },
    });

    const bulkDeleteMutation = trpc.student.bulkDelete.useMutation({
        onSuccess: (_data, variables) => {
            utils.student.list.invalidate();

            // GA4 이벤트: 학생 일괄 삭제
            analytics.trackStudentDeleted(variables.ids.length);
        },
    });

    const restoreMutation = trpc.student.restore.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
        },
    });

    const graduateMutation = trpc.student.graduate.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
        },
    });

    const cancelGraduationMutation = trpc.student.cancelGraduation.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
        },
    });

    const search = (option: typeof searchOption, word: string) => {
        setSearchOption(option);
        setSearchWord(word);
        setPage(1);
    };

    const changeDeleteFilter = (filter: DeleteFilter) => {
        setDeleteFilter(filter);
        setPage(1);
    };

    const changeGraduatedFilter = (filter: GraduatedFilter) => {
        setGraduatedFilter(filter);
        setPage(1);
    };

    return {
        students: listQuery.data?.students ?? [],
        total: listQuery.data?.total ?? 0,
        totalPage: listQuery.data?.totalPage ?? 0,
        currentPage: page,
        isLoading: listQuery.isLoading,
        error: listQuery.error,

        setPage,
        search,
        searchOption,
        searchWord,

        deleteFilter,
        changeDeleteFilter,

        graduatedFilter,
        changeGraduatedFilter,

        create: (input: CreateStudentInput) => createMutation.mutateAsync(input),
        isCreating: createMutation.isPending,

        update: (input: UpdateStudentInput) => updateMutation.mutateAsync(input),
        isUpdating: updateMutation.isPending,

        delete: (id: string) => deleteMutation.mutateAsync({ id }),
        isDeleting: deleteMutation.isPending,

        bulkDelete: (ids: string[]) => bulkDeleteMutation.mutateAsync({ ids }),
        isBulkDeleting: bulkDeleteMutation.isPending,

        restore: (ids: string[]) => restoreMutation.mutateAsync({ ids }),
        isRestoring: restoreMutation.isPending,

        graduate: (ids: string[]) => graduateMutation.mutateAsync({ ids }),
        isGraduating: graduateMutation.isPending,

        cancelGraduation: (ids: string[]) => cancelGraduationMutation.mutateAsync({ ids }),
        isCancellingGraduation: cancelGraduationMutation.isPending,
    };
}

/**
 * 단일 학생 조회 훅
 */
export function useStudent(id: string) {
    return trpc.student.get.useQuery({ id }, { enabled: !!id });
}
