import type { GenderDistributionOutput } from '@school/trpc';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

interface GenderDistributionChartProps {
    data?: GenderDistributionOutput;
    isLoading: boolean;
    error?: boolean;
}

const COLORS = ['#3b82f6', '#ec4899', '#9ca3af'];

export function GenderDistributionChart({ data, isLoading, error }: GenderDistributionChartProps) {
    const chartData = data
        ? [
              { name: '남학생', value: data.male.count, rate: data.male.rate },
              { name: '여학생', value: data.female.count, rate: data.female.rate },
              { name: '미지정', value: data.unknown.count, rate: data.unknown.rate },
          ].filter((item) => item.value > 0)
        : [];

    const totalStudents = data ? data.male.count + data.female.count + data.unknown.count : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">성별 분포</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : chartData.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, _name, props) => [
                                        `${value}명 (${props.payload.rate}%)`,
                                        props.payload.name,
                                    ]}
                                />
                                <Legend
                                    formatter={(value) => {
                                        const item = chartData.find((d) => d.name === value);
                                        return `${value}: ${item?.value ?? 0}명`;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-muted-foreground">총 {totalStudents}명</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                )}
            </CardContent>
        </Card>
    );
}
