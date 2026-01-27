import type { CreateGroupInput, UpdateGroupInput } from '@school/trpc';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export function useGroups() {
    const utils = trpc.useUtils();

    const listQuery = trpc.group.list.useQuery();

    const getQuery = (id: string) => trpc.group.get.useQuery({ id }, { enabled: !!id });

    const createMutation = trpc.group.create.useMutation({
        onSuccess: (data) => {
            utils.group.list.invalidate();

            // GA4 이벤트: 첫 그룹 생성
            if (data.isFirstGroup && data.daysSinceSignup !== undefined) {
                analytics.trackFirstGroupCreated(data.daysSinceSignup);
            }
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

        create: (input: CreateGroupInput) => createMutation.mutateAsync(input),
        isCreating: createMutation.isPending,

        update: (input: UpdateGroupInput) => updateMutation.mutateAsync(input),
        isUpdating: updateMutation.isPending,

        delete: (id: string) => deleteMutation.mutateAsync({ id }),
        isDeleting: deleteMutation.isPending,

        bulkDelete: (ids: string[]) => bulkDeleteMutation.mutateAsync({ ids }),
        isBulkDeleting: bulkDeleteMutation.isPending,
    };
}
