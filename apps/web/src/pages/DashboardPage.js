import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { AttendanceRateChart, AvgAttendanceChart, GenderDistributionChart, GroupStatisticsTable, TopRankingCard, } from '~/components/dashboard';
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
    const topGroupItems = stats.topGroups?.groups.map((g) => ({
        id: g.groupId,
        name: g.groupName,
        value: g.attendanceRate,
        valueSuffix: '%',
    })) ?? [];
    const topStudentItems = stats.topOverall?.students.map((s) => ({
        id: s.id,
        name: s.societyName,
        subText: s.groupName,
        value: s.score,
        valueSuffix: '점',
    })) ?? [];
    return (_jsx(MainLayout, { title: `안녕하세요, ${account?.name}님!`, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { children: "\uD1B5\uACC4 \uC5F0\uB3C4" }), _jsxs(Select, { value: selectedYear.toString(), onValueChange: (v) => setSelectedYear(Number(v)), children: [_jsx(SelectTrigger, { className: "w-28", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: yearOptions.map((y) => (_jsx(SelectItem, { value: y.value, children: y.label }, y.value))) })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsx(AttendanceRateChart, { weekly: stats.weekly, monthly: stats.monthly, yearly: stats.yearly, isLoading: stats.isLoading, error: hasError }), _jsx(AvgAttendanceChart, { weekly: stats.weekly, monthly: stats.monthly, yearly: stats.yearly, isLoading: stats.isLoading, error: hasError })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsx(GenderDistributionChart, { data: stats.byGender, isLoading: stats.isLoading, error: hasError }), _jsx(TopRankingCard, { title: "\uADF8\uB8F9\uBCC4 \uCD9C\uC11D\uB960 TOP 5", items: topGroupItems, isLoading: stats.isLoading, error: hasError }), _jsx(TopRankingCard, { title: "\uC804\uCCB4 \uC6B0\uC218 \uCD9C\uC11D \uD559\uC0DD TOP 5", items: topStudentItems, isLoading: stats.isLoading, error: hasError })] }), _jsx(GroupStatisticsTable, { data: stats.groupStatistics, isLoading: stats.isLoading, error: hasError })] }) }));
}
