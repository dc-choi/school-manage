import { trpc } from '~/lib/trpc';
export function useGroups() {
    const utils = trpc.useUtils();
    const listQuery = trpc.group.list.useQuery();
    const getQuery = (id) => trpc.group.get.useQuery({ id }, { enabled: !!id });
    const createMutation = trpc.group.create.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();
        },
    });
    const updateMutation = trpc.group.update.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();
            utils.group.get.invalidate();
        },
    });
    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();
        },
    });
    const bulkDeleteMutation = trpc.group.bulkDelete.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();
        },
    });
    return {
        groups: listQuery.data?.groups ?? [],
        isLoading: listQuery.isLoading,
        error: listQuery.error,
        getQuery,
        create: (input) => createMutation.mutateAsync(input),
        isCreating: createMutation.isPending,
        update: (input) => updateMutation.mutateAsync(input),
        isUpdating: updateMutation.isPending,
        delete: (id) => deleteMutation.mutateAsync({ id }),
        isDeleting: deleteMutation.isPending,
        bulkDelete: (ids) => bulkDeleteMutation.mutateAsync({ ids }),
        isBulkDeleting: bulkDeleteMutation.isPending,
    };
}
