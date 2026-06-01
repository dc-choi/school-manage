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

            // GA4 control 이벤트: 출석 저장 완료 (매 저장마다 발화).
            // first_attendance_recorded 0건이 "신규 단체 모집단 부족"인지 "침묵 실패"인지
            // 구별하는 대조 이벤트. 백엔드가 항상 studentCount를 반환하나 타입상 선택형이라 방어 가드.
            if (data.studentCount !== undefined) {
                analytics.trackAttendanceRecorded({
                    studentCount: data.studentCount,
                    fullAttendanceCount: data.fullAttendanceCount,
                    massOnlyCount: data.massOnlyCount,
                    catechismOnlyCount: data.catechismOnlyCount,
                    absentCount: data.absentCount,
                    attendanceRate: data.attendanceRate,
                });
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
