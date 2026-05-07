import { getNthSundayOf, getWeeksInMonth } from '@school/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useDashboardStatistics } from '~/features/statistics';
import { analytics } from '~/lib/analytics';
import { GenderDistributionChart } from '~/pages/dashboard/GenderDistributionChart';
import { GroupStatisticsTable } from '~/pages/dashboard/GroupStatisticsTable';
import { TopRankingCard } from '~/pages/dashboard/TopRankingCard';

const PARAM_YEAR = 'year';
const PARAM_MONTH = 'month';
const PARAM_WEEK = 'week';

export const parseIntParam = (value: string | null): number | undefined => {
    if (!value) return undefined;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : undefined;
};

export function StatisticsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [now] = useState(() => new Date());
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const year = parseIntParam(searchParams.get(PARAM_YEAR)) ?? currentYear;
    const month = parseIntParam(searchParams.get(PARAM_MONTH));
    const week = parseIntParam(searchParams.get(PARAM_WEEK));

    const stats = useDashboardStatistics({ year, month, week });
    const hasError = !!stats.error;

    useEffect(() => {
        analytics.trackStatisticsViewed();
    }, []);

    const updateParams = (next: { year: number; month?: number; week?: number }) => {
        const params = new URLSearchParams();
        params.set(PARAM_YEAR, String(next.year));
        if (next.month !== undefined) params.set(PARAM_MONTH, String(next.month));
        if (next.week !== undefined) params.set(PARAM_WEEK, String(next.week));
        setSearchParams(params, { replace: true });
    };

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

    const monthOptions = useMemo(() => {
        const maxMonth = year === currentYear ? currentMonth : 12;
        const months = [{ value: '', label: '전체' }];
        for (let m = 1; m <= maxMonth; m++) {
            months.push({ value: m.toString(), label: `${m}월` });
        }
        return months;
    }, [year, currentYear, currentMonth]);

    const weekOptions = useMemo(() => {
        if (!month) return [{ value: '', label: '전체' }];
        const weeksInMonth = getWeeksInMonth(year, month);
        const isCurrentMonth = year === currentYear && month === currentMonth;
        const weeks = [{ value: '', label: '전체' }];
        for (let w = 1; w <= weeksInMonth; w++) {
            if (isCurrentMonth && getNthSundayOf(year, month, w) > now) break;
            weeks.push({ value: w.toString(), label: `${w}주차` });
        }
        return weeks;
    }, [year, month, currentYear, currentMonth, now]);

    const topStudentItems =
        stats.topOverall?.students.map((s) => ({
            id: s.id,
            name: s.societyName,
            subText: s.groupName,
            value: s.score,
            valueSuffix: '점',
        })) ?? [];

    return (
        <MainLayout title="통계">
            <div className="flex flex-col gap-3 md:h-[calc(100vh-7.5rem)]">
                {/* 필터 — 라벨과 컨트롤을 그룹핑하여 줄바꿈 시 함께 떨어지게 */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground" id="filter-year-label">
                            연도
                        </span>
                        <Select value={year.toString()} onValueChange={(v) => updateParams({ year: Number(v) })}>
                            <SelectTrigger className="h-9 w-20" aria-labelledby="filter-year-label">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y.value} value={y.value}>
                                        {y.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground" id="filter-month-label">
                            월
                        </span>
                        <Select
                            value={month?.toString() ?? ''}
                            onValueChange={(v) =>
                                updateParams({ year, month: v && v !== 'all' ? Number(v) : undefined })
                            }
                        >
                            <SelectTrigger className="h-9 w-20" aria-labelledby="filter-month-label">
                                <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((m) => (
                                    <SelectItem key={m.value || 'all'} value={m.value || 'all'}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground" id="filter-week-label">
                            주차
                        </span>
                        <Select
                            value={week?.toString() ?? ''}
                            onValueChange={(v) =>
                                updateParams({
                                    year,
                                    month,
                                    week: v && v !== 'all' ? Number(v) : undefined,
                                })
                            }
                            disabled={!month}
                        >
                            <SelectTrigger className="h-9 w-20" aria-labelledby="filter-week-label">
                                <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {weekOptions.map((w) => (
                                    <SelectItem key={w.value || 'all'} value={w.value || 'all'}>
                                        {w.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 학년별 상세 통계 */}
                <GroupStatisticsTable
                    data={stats.groupStatistics}
                    isLoading={stats.isLoading}
                    error={hasError}
                    className="min-h-0 flex-1"
                />

                {/* 성별 분포 & 우수 출석 학생 */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <GenderDistributionChart data={stats.byGender} isLoading={stats.isLoading} error={hasError} />
                    <TopRankingCard
                        title="전체 우수 출석 학생 TOP 5"
                        items={topStudentItems}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                </div>
            </div>
        </MainLayout>
    );
}
