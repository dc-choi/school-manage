import type { AttendanceData } from '@school/trpc';
import { trpc } from '~/lib/trpc';

export function useAttendance(groupId: string, year?: number) {
    const utils = trpc.useUtils();

    const { data, isLoading, error } = trpc.group.attendance.useQuery({ groupId, year }, { enabled: !!groupId });

    const updateMutation = trpc.attendance.update.useMutation({
        onSuccess: () => {
            utils.group.attendance.invalidate({ groupId, year });
        },
    });

    const updateAttendance = async (attendanceData: AttendanceData[], isFull: boolean) => {
        if (!year && !data?.year) return;
        return updateMutation.mutateAsync({
            year: year || data!.year,
            attendance: attendanceData,
            isFull,
        });
    };

    return {
        data,
        isLoading,
        error,
        updateAttendance,
        isUpdating: updateMutation.isPending,
    };
}
