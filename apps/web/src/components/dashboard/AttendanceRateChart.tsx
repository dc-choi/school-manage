import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import type { AttendanceRateOutput } from '@school/trpc';

interface AttendanceRateChartProps {
    weekly?: AttendanceRateOutput;
    monthly?: AttendanceRateOutput;
    yearly?: AttendanceRateOutput;
    isLoading: boolean;
    error?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export function AttendanceRateChart({ weekly, monthly, yearly, isLoading, error }: AttendanceRateChartProps) {
    const data = [
        { name: '주간', value: weekly?.attendanceRate ?? 0, period: weekly },
        { name: '월간', value: monthly?.attendanceRate ?? 0, period: monthly },
        { name: '연간', value: yearly?.attendanceRate ?? 0, period: yearly },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">전체 출석률</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis domain={[0, 100]} fontSize={12} tickFormatter={(v) => `${v}%`} />
                            <Tooltip
                                formatter={(value) => [`${value}%`, '출석률']}
                                labelFormatter={(label) => {
                                    const item = data.find((d) => d.name === label);
                                    if (item?.period) {
                                        return `${label} (${item.period.startDate} ~ ${item.period.endDate})`;
                                    }
                                    return label;
                                }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}