import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];
export function AttendanceRateChart({ weekly, monthly, yearly, isLoading, error }) {
    const data = [
        { name: '주간', value: weekly?.attendanceRate ?? 0, period: weekly },
        { name: '월간', value: monthly?.attendanceRate ?? 0, period: monthly },
        { name: '연간', value: yearly?.attendanceRate ?? 0, period: yearly },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "\uC804\uCCB4 \uCD9C\uC11D\uB960" }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex h-[200px] items-center justify-center", children: _jsx(LoadingSpinner, {}) })) : error ? (_jsx("p", { className: "text-sm text-destructive", children: "\uB370\uC774\uD130 \uB85C\uB4DC \uC2E4\uD328" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: data, margin: { top: 10, right: 10, left: -10, bottom: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name", fontSize: 12 }), _jsx(YAxis, { domain: [0, 100], fontSize: 12, tickFormatter: (v) => `${v}%` }), _jsx(Tooltip, { formatter: (value) => [`${value}%`, '출석률'], labelFormatter: (label) => {
                                    const item = data.find((d) => d.name === label);
                                    if (item?.period) {
                                        return `${label} (${item.period.startDate} ~ ${item.period.endDate})`;
                                    }
                                    return label;
                                } }), _jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: data.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) })] }) })) })] }));
}
