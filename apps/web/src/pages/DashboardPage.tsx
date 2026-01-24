import { useMemo, useState } from 'react';
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

export function DashboardPage() {
    const { account } = useAuth();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const stats = useDashboardStatistics(selectedYear);
    const hasError = !!stats.error;

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

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
                {/* 연도 선택 */}
                <div className="flex items-center gap-2">
                    <Label>통계 연도</Label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-28">
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
                <GroupStatisticsTable
                    data={stats.groupStatistics}
                    isLoading={stats.isLoading}
                    error={hasError}
                />
            </div>
        </MainLayout>
    );
}
