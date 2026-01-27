import { getWeeksInMonth } from '@school/utils';
import { useEffect, useMemo, useState } from 'react';
import {
    AttendanceRateChart,
    AvgAttendanceChart,
    GenderDistributionChart,
    GroupStatisticsTable,
    TopRankingCard,
} from '~/components/dashboard';
import { MainLayout } from '~/components/layout';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useAuth } from '~/features/auth';
import { useDashboardStatistics } from '~/features/statistics';
import { analytics } from '~/lib/analytics';

export function DashboardPage() {
    const { account } = useAuth();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);

    const stats = useDashboardStatistics({
        year: selectedYear,
        month: selectedMonth,
        week: selectedWeek,
    });
    const hasError = !!stats.error;

    // GA4 이벤트: 대시보드 진입
    useEffect(() => {
        analytics.trackDashboardViewed();
    }, []);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

    const monthOptions = useMemo(() => {
        const months = [{ value: '', label: '전체' }];
        for (let m = 1; m <= 12; m++) {
            months.push({ value: m.toString(), label: `${m}월` });
        }
        return months;
    }, []);

    const weekOptions = useMemo(() => {
        if (!selectedMonth) {
            return [{ value: '', label: '전체' }];
        }
        const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
        const weeks = [{ value: '', label: '전체' }];
        for (let w = 1; w <= weeksInMonth; w++) {
            weeks.push({ value: w.toString(), label: `${w}주차` });
        }
        return weeks;
    }, [selectedYear, selectedMonth]);

    const topGroupItems =
        stats.topGroups?.groups.map((g) => ({
            id: g.groupId,
            name: g.groupName,
            value: g.attendanceRate,
            valueSuffix: '%',
        })) ?? [];

    const topStudentItems =
        stats.topOverall?.students.map((s) => ({
            id: s.id,
            name: s.societyName,
            subText: s.groupName,
            value: s.score,
            valueSuffix: '점',
        })) ?? [];

    return (
        <MainLayout title={`안녕하세요, ${account?.name}님!`}>
            <div className="space-y-4">
                {/* 연도/월/주차 선택 */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label>연도</Label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(v) => {
                                setSelectedYear(Number(v));
                                setSelectedMonth(undefined);
                                setSelectedWeek(undefined);
                            }}
                        >
                            <SelectTrigger className="w-24">
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

                    <div className="flex items-center gap-2">
                        <Label>월</Label>
                        <Select
                            value={selectedMonth?.toString() ?? ''}
                            onValueChange={(v) => {
                                setSelectedMonth(v ? Number(v) : undefined);
                                setSelectedWeek(undefined);
                            }}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue placeholder="전체" />
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

                    <div className="flex items-center gap-2">
                        <Label>주차</Label>
                        <Select
                            value={selectedWeek?.toString() ?? ''}
                            onValueChange={(v) => setSelectedWeek(v && v !== 'all' ? Number(v) : undefined)}
                            disabled={!selectedMonth}
                        >
                            <SelectTrigger className="w-24">
                                <SelectValue placeholder="전체" />
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

                {/* 출석률 & 평균 출석 인원 차트 */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <AttendanceRateChart
                        weekly={stats.weekly}
                        monthly={stats.monthly}
                        yearly={stats.yearly}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                    <AvgAttendanceChart
                        weekly={stats.weekly}
                        monthly={stats.monthly}
                        yearly={stats.yearly}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                </div>

                {/* 성별 분포 & TOP 순위 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <GenderDistributionChart data={stats.byGender} isLoading={stats.isLoading} error={hasError} />
                    <TopRankingCard
                        title="그룹별 출석률 TOP 5"
                        items={topGroupItems}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                    <TopRankingCard
                        title="전체 우수 출석 학생 TOP 5"
                        items={topStudentItems}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                </div>

                {/* 그룹별 상세 통계 테이블 */}
                <GroupStatisticsTable data={stats.groupStatistics} isLoading={stats.isLoading} error={hasError} />
            </div>
        </MainLayout>
    );
}
