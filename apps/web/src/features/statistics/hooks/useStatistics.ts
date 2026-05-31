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
    day?: string;
}

/**
 * 대시보드 통계 훅
 * 성별 분포, TOP 학생, 그룹별 상세 통계 조회
 */
export function useDashboardStatistics(filters: DashboardFilters) {
    const { year, month, week, day } = filters;

    // 성별 분포
    const byGenderQuery = trpc.statistics.byGender.useQuery({ year, month, week });

    // TOP 학생 — "전체 우수 출석"은 연간 누적 점수 순위이므로 기간 필터(month/week)에
    // 종속되지 않고 연도 스코프로 고정한다. month/week를 넘기면 단일 주 범위로 좁혀져
    // 점수 상한이 2점(◎ 1회)으로 붕괴되고 순위가 무의미해진다.
    const topOverallQuery = trpc.statistics.topOverall.useQuery({ year, limit: 5 });

    // 그룹별 상세 통계 (일간 포함)
    const groupStatisticsQuery = trpc.statistics.groupStatistics.useQuery({ year, month, week, day });

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
