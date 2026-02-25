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

function GenderContent({
    chartData,
    totalStudents,
    isLoading,
    error,
}: {
    chartData: { name: string; value: number; rate: number }[];
    totalStudents: number;
    isLoading: boolean;
    error?: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }
    if (error) return <p className="text-sm text-destructive">데이터 로드 실패</p>;
    if (chartData.length > 0) {
        return (
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
                            {chartData.map((entry, index) => (
                                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
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
        );
    }
    return <p className="text-sm text-muted-foreground">데이터 없음</p>;
}

export function GenderDistributionChart({ data, isLoading, error }: GenderDistributionChartProps) {
    const chartData = data
        ? [
              { name: '남', value: data.male.count, rate: data.male.rate },
              { name: '여', value: data.female.count, rate: data.female.rate },
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
                <GenderContent
                    chartData={chartData}
                    totalStudents={totalStudents}
                    isLoading={isLoading}
                    error={error}
                />
            </CardContent>
        </Card>
    );
}
