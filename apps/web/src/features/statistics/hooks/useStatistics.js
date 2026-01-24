import { trpc } from '~/lib/trpc';
export function useStatistics(year) {
    const { data, isLoading, error } = trpc.statistics.excellent.useQuery({ year });
    return {
        excellentStudents: data?.excellentStudents ?? [],
        isLoading,
        error,
    };
}
/**
 * 대시보드 통계 훅
 * 주간/월간/연간 출석률, 성별 분포, TOP 그룹/학생 조회
 * 평균 출석 인원은 weekly/monthly/yearly의 avgAttendance 필드에서 추출
 */
export function useDashboardStatistics(year) {
    // 출석률 조회 (주간/월간/연간) - avgAttendance 포함
    const weeklyQuery = trpc.statistics.weekly.useQuery({ year });
    const monthlyQuery = trpc.statistics.monthly.useQuery({ year });
    const yearlyQuery = trpc.statistics.yearly.useQuery({ year });
    // 성별 분포
    const byGenderQuery = trpc.statistics.byGender.useQuery({ year });
    // TOP 그룹/학생
    const topGroupsQuery = trpc.statistics.topGroups.useQuery({ year, limit: 5 });
    const topOverallQuery = trpc.statistics.topOverall.useQuery({ year, limit: 5 });
    // 그룹별 상세 통계
    const groupStatisticsQuery = trpc.statistics.groupStatistics.useQuery({ year });
    const isLoading = weeklyQuery.isLoading ||
        monthlyQuery.isLoading ||
        yearlyQuery.isLoading ||
        byGenderQuery.isLoading ||
        topGroupsQuery.isLoading ||
        topOverallQuery.isLoading ||
        groupStatisticsQuery.isLoading;
    const error = weeklyQuery.error ||
        monthlyQuery.error ||
        yearlyQuery.error ||
        byGenderQuery.error ||
        topGroupsQuery.error ||
        topOverallQuery.error ||
        groupStatisticsQuery.error;
    return {
        weekly: weeklyQuery.data,
        monthly: monthlyQuery.data,
        yearly: yearlyQuery.data,
        byGender: byGenderQuery.data,
        topGroups: topGroupsQuery.data,
        topOverall: topOverallQuery.data,
        groupStatistics: groupStatisticsQuery.data,
        isLoading,
        error,
    };
}
