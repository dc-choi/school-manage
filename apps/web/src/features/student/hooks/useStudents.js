import { useState } from 'react';
import { trpc } from '~/lib/trpc';
export function useStudents(options = {}) {
    const [page, setPage] = useState(options.initialPage ?? 1);
    const [searchOption, setSearchOption] = useState(options.searchOption ?? 'all');
    const [searchWord, setSearchWord] = useState(options.searchWord ?? '');
    const [deleteFilter, setDeleteFilter] = useState(options.initialDeleteFilter ?? 'active');
    const [graduatedFilter, setGraduatedFilter] = useState(options.initialGraduatedFilter ?? 'active');
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
        onSuccess: () => {
            utils.student.list.invalidate();
        },
    });
    const updateMutation = trpc.student.update.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
            utils.student.get.invalidate();
        },
    });
    const deleteMutation = trpc.student.delete.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
        },
    });
    const bulkDeleteMutation = trpc.student.bulkDelete.useMutation({
        onSuccess: () => {
            utils.student.list.invalidate();
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
    const search = (option, word) => {
        setSearchOption(option);
        setSearchWord(word);
        setPage(1);
    };
    const changeDeleteFilter = (filter) => {
        setDeleteFilter(filter);
        setPage(1);
    };
    const changeGraduatedFilter = (filter) => {
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
        create: (input) => createMutation.mutateAsync(input),
        isCreating: createMutation.isPending,
        update: (input) => updateMutation.mutateAsync(input),
        isUpdating: updateMutation.isPending,
        delete: (id) => deleteMutation.mutateAsync({ id }),
        isDeleting: deleteMutation.isPending,
        bulkDelete: (ids) => bulkDeleteMutation.mutateAsync({ ids }),
        isBulkDeleting: bulkDeleteMutation.isPending,
        restore: (ids) => restoreMutation.mutateAsync({ ids }),
        isRestoring: restoreMutation.isPending,
        graduate: (ids) => graduateMutation.mutateAsync({ ids }),
        isGraduating: graduateMutation.isPending,
        cancelGraduation: (ids) => cancelGraduationMutation.mutateAsync({ ids }),
        isCancellingGraduation: cancelGraduationMutation.isPending,
    };
}
/**
 * 단일 학생 조회 훅
 */
export function useStudent(id) {
    return trpc.student.get.useQuery({ id }, { enabled: !!id });
}
