import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
const COLORS = ['#8b5cf6', '#06b6d4', '#f97316'];
export function AvgAttendanceChart({ weekly, monthly, yearly, isLoading, error }) {
    const hasData = weekly && monthly && yearly;
    const chartData = hasData
        ? [
            {
                name: '주간',
                value: weekly.avgAttendance,
                period: `${weekly.startDate} ~ ${weekly.endDate}`,
            },
            {
                name: '월간',
                value: monthly.avgAttendance,
                period: `${monthly.startDate} ~ ${monthly.endDate}`,
            },
            {
                name: '연간',
                value: yearly.avgAttendance,
                period: `${yearly.startDate} ~ ${yearly.endDate}`,
            },
        ]
        : [];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "\uD3C9\uADE0 \uCD9C\uC11D \uC778\uC6D0" }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex h-[200px] items-center justify-center", children: _jsx(LoadingSpinner, {}) })) : error ? (_jsx("p", { className: "text-sm text-destructive", children: "\uB370\uC774\uD130 \uB85C\uB4DC \uC2E4\uD328" })) : chartData.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: chartData, margin: { top: 10, right: 10, left: -10, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name", fontSize: 12 }), _jsx(YAxis, { fontSize: 12, tickFormatter: (v) => `${v}명` }), _jsx(Tooltip, { formatter: (value) => [`${value}명`, '평균 출석'], labelFormatter: (label) => {
                                    const item = chartData.find((d) => d.name === label);
                                    return item ? `${label} (${item.period})` : label;
                                } }), _jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: chartData.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) })] }) })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "\uB370\uC774\uD130 \uC5C6\uC74C" })) })] }));
}
