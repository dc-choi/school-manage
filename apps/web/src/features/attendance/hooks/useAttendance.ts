import type { AttendanceData } from '@school/trpc';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export function useAttendance(groupId: string, year?: number) {
    const utils = trpc.useUtils();

    const { data, isLoading, error } = trpc.group.attendance.useQuery({ groupId, year }, { enabled: !!groupId });

    const updateMutation = trpc.attendance.update.useMutation({
        onSuccess: (result) => {
            utils.group.attendance.invalidate({ groupId, year });
            utils.statistics.weekly.invalidate();

            // GA4 이벤트: 첫 출석 기록
            if (result.isFirstAttendance && result.daysSinceSignup !== undefined) {
                analytics.trackFirstAttendanceRecorded(result.daysSinceSignup);
            }

            // GA4 이벤트: 출석 기록 (항상 전송)
            if (result.studentCount && result.studentCount > 0) {
                analytics.trackAttendanceRecorded({
                    studentCount: result.studentCount,
                    fullAttendanceCount: result.fullAttendanceCount,
                    massOnlyCount: result.massOnlyCount,
                    catechismOnlyCount: result.catechismOnlyCount,
                    absentCount: result.absentCount,
                    attendanceRate: result.attendanceRate,
                });
            }
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
