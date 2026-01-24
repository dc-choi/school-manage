import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
const COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];
export function GenderDistributionChart({ data, isLoading, error }) {
    const chartData = data
        ? [
            { name: '남학생', value: data.male.count, rate: data.male.rate },
            { name: '여학생', value: data.female.count, rate: data.female.rate },
            { name: '미지정', value: data.unknown.count, rate: data.unknown.rate },
        ].filter((item) => item.value > 0)
        : [];
    const totalStudents = data ? data.male.count + data.female.count + data.unknown.count : 0;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "\uC131\uBCC4 \uBD84\uD3EC" }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex h-[200px] items-center justify-center", children: _jsx(LoadingSpinner, {}) })) : error ? (_jsx("p", { className: "text-sm text-destructive", children: "\uB370\uC774\uD130 \uB85C\uB4DC \uC2E4\uD328" })) : chartData.length > 0 ? (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(ResponsiveContainer, { width: "100%", height: 180, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: chartData, cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 70, paddingAngle: 2, dataKey: "value", children: chartData.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, _name, props) => [
                                            `${value}명 (${props.payload.rate}%)`,
                                            props.payload.name,
                                        ] }), _jsx(Legend, { formatter: (value) => {
                                            const item = chartData.find((d) => d.name === value);
                                            return `${value}: ${item?.value ?? 0}명`;
                                        } })] }) }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\uCD1D ", totalStudents, "\uBA85"] })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "\uB370\uC774\uD130 \uC5C6\uC74C" })) })] }));
}
