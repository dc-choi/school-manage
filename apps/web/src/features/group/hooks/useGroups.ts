import type { CreateGroupInput, UpdateGroupInput } from '@school/trpc';
import { toast } from 'sonner';
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

            // GA4 이벤트: 그룹 생성
            analytics.trackGroupCreated();

            toast.success('학년이 생성되었습니다.');
        },
    });

    const updateMutation = trpc.group.update.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();
            utils.group.get.invalidate();

            // GA4 이벤트: 그룹 수정
            analytics.trackGroupUpdated();

            toast.success('학년이 수정되었습니다.');
        },
    });

    const deleteMutation = trpc.group.delete.useMutation({
        onSuccess: () => {
            utils.group.list.invalidate();

            // GA4 이벤트: 그룹 삭제
            analytics.trackGroupDeleted(1);

            toast.success('학년이 삭제되었습니다.');
        },
    });

    const bulkDeleteMutation = trpc.group.bulkDelete.useMutation({
        onSuccess: (_data, variables) => {
            utils.group.list.invalidate();

            // GA4 이벤트: 그룹 일괄 삭제
            analytics.trackGroupDeleted(variables.ids.length);

            toast.success('선택한 학년이 삭제되었습니다.');
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
