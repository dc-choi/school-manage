import { trpc } from '~/lib/trpc';

export function useStatistics(year?: number) {
    const { data, isLoading, error } = trpc.statistics.excellent.useQuery({ year });

    return {
        excellentStudents: data?.excellentStudents ?? [],
        isLoading,
        error,
    };
}

/**
 * 대시보드 통계 필터
 */
export interface DashboardFilters {
    year?: number;
    month?: number;
    week?: number;
}

/**
 * 대시보드 통계 훅
 * 성별 분포, TOP 학생, 그룹별 상세 통계 조회
 */
export function useDashboardStatistics(filters: DashboardFilters) {
    const { year, month, week } = filters;

    // 성별 분포
    const byGenderQuery = trpc.statistics.byGender.useQuery({ year, month, week });

    // TOP 학생
    const topOverallQuery = trpc.statistics.topOverall.useQuery({ year, month, week, limit: 5 });

    // 그룹별 상세 통계
    const groupStatisticsQuery = trpc.statistics.groupStatistics.useQuery({ year, month, week });

    const isLoading = byGenderQuery.isLoading || topOverallQuery.isLoading || groupStatisticsQuery.isLoading;

    const error = byGenderQuery.error || topOverallQuery.error || groupStatisticsQuery.error;

    return {
        byGender: byGenderQuery.data,
        topOverall: topOverallQuery.data,
        groupStatistics: groupStatisticsQuery.data,
        isLoading,
        error,
    };
}
