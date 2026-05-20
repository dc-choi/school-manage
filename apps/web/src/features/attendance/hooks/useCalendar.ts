import type { AttendanceData } from '@school/shared';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

/**
 * 달력 형태의 출석부 데이터 훅
 */
export function useCalendar(groupId: string, year: number, month: number) {
    const utils = trpc.useUtils();

    // 달력 데이터 조회
    const {
        data: calendarData,
        isLoading,
        error,
    } = trpc.attendance.calendar.useQuery({ groupId, year, month }, { enabled: !!groupId });

    // 출석 업데이트 뮤테이션 (기존 API 활용)
    const updateMutation = trpc.attendance.update.useMutation({
        onSuccess: async (data) => {
            // GA4 이벤트: 첫 출석 기록 (가입 후 첫 출석 입력 시점, T-1)
            if (data.isFirstAttendance && data.daysSinceSignup !== undefined) {
                analytics.trackFirstAttendanceRecorded(data.daysSinceSignup);
            }

            // 달력 데이터 캐시 무효화 후 refetch
            await utils.attendance.calendar.invalidate({ groupId, year, month });
        },
    });

    /**
     * 출석 업데이트
     *
     * 서버는 항목별 content로 자동 분기: ◎/○/△는 upsert, `-`/`''`는 hard delete.
     * @param attendanceData - 출석 데이터 배열
     */
    const updateAttendance = async (attendanceData: AttendanceData[]) => {
        return updateMutation.mutateAsync({
            year,
            groupId,
            attendance: attendanceData,
        });
    };

    /**
     * 달력 데이터 수동 갱신
     */
    const refreshCalendar = async () => {
        await utils.attendance.calendar.invalidate({ groupId, year, month });
    };

    return {
        data: calendarData,
        isLoading,
        error,
        refreshCalendar,
        updateAttendance,
        isUpdating: updateMutation.isPending,
    };
}

/**
 * 날짜별 출석 상세 조회 훅 (모달용)
 */
export function useDayDetail(groupId: string, date: string, enabled: boolean = true) {
    const utils = trpc.useUtils();

    const { data, isLoading, error, refetch } = trpc.attendance.dayDetail.useQuery(
        { groupId, date },
        { enabled: enabled && !!groupId && !!date }
    );

    /**
     * 날짜별 상세 데이터 수동 갱신
     */
    const refreshDayDetail = async () => {
        await utils.attendance.dayDetail.invalidate({ groupId, date });
    };

    return {
        data,
        isLoading,
        error,
        refetch,
        refreshDayDetail,
    };
}

/**
 * 의무축일 데이터 훅
 */
export function useHolydays(year: number) {
    const { data, isLoading, error } = trpc.liturgical.holydays.useQuery({ year });

    return {
        holydays: data?.holydays ?? [],
        isLoading,
        error,
    };
}
