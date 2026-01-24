import { trpc } from '~/lib/trpc';
/**
 * 달력 형태의 출석부 데이터 훅
 */
export function useCalendar(groupId, year, month) {
    const utils = trpc.useUtils();
    // 달력 데이터 조회
    const { data: calendarData, isLoading, error, } = trpc.attendance.calendar.useQuery({ groupId, year, month }, { enabled: !!groupId });
    // 출석 업데이트 뮤테이션 (기존 API 활용)
    const updateMutation = trpc.attendance.update.useMutation({
        onSuccess: async () => {
            // 달력 데이터 캐시 무효화 후 refetch
            await utils.attendance.calendar.invalidate({ groupId, year, month });
        },
    });
    /**
     * 출석 업데이트
     * @param attendanceData - 출석 데이터 배열
     * @param isFull - true: insert/update, false: delete
     */
    const updateAttendance = async (attendanceData, isFull) => {
        return updateMutation.mutateAsync({
            year,
            attendance: attendanceData,
            isFull,
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
export function useDayDetail(groupId, date, enabled = true) {
    const utils = trpc.useUtils();
    const { data, isLoading, error, refetch } = trpc.attendance.dayDetail.useQuery({ groupId, date }, { enabled: enabled && !!groupId && !!date });
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
export function useHolydays(year) {
    const { data, isLoading, error } = trpc.liturgical.holydays.useQuery({ year });
    return {
        holydays: data?.holydays ?? [],
        isLoading,
        error,
    };
}
