import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import type { AttendanceRateOutput } from '@school/trpc';

interface AvgAttendanceChartProps {
    weekly?: AttendanceRateOutput;
    monthly?: AttendanceRateOutput;
    yearly?: AttendanceRateOutput;
    isLoading: boolean;
    error?: boolean;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f97316'];

export function AvgAttendanceChart({ weekly, monthly, yearly, isLoading, error }: AvgAttendanceChartProps) {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">평균 출석 인원</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} tickFormatter={(v) => `${v}명`} />
                            <Tooltip
                                formatter={(value) => [`${value}명`, '평균 출석']}
                                labelFormatter={(label) => {
                                    const item = chartData.find((d) => d.name === label);
                                    return item ? `${label} (${item.period})` : label;
                                }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                )}
            </CardContent>
        </Card>
    );
}