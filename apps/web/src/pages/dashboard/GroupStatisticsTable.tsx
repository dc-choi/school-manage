import type { GroupStatisticsItem, GroupStatisticsOutput } from '@school/trpc';
import { roundToDecimal } from '@school/utils';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';

const computeWeightedRate = (
    groups: GroupStatisticsItem[],
    totalStudents: number,
    period: 'weekly' | 'monthly' | 'yearly'
): number => {
    if (totalStudents === 0) return 0;
    const weightedSum = groups.reduce((sum, g) => sum + g[period].attendanceRate * g.totalStudents, 0);
    return roundToDecimal(weightedSum / totalStudents, 1);
};

function TotalRow({ groups }: { groups: GroupStatisticsItem[] }) {
    const totalStudents = groups.reduce((sum, g) => sum + g.totalStudents, 0);

    const weeklyRate = computeWeightedRate(groups, totalStudents, 'weekly');
    const monthlyRate = computeWeightedRate(groups, totalStudents, 'monthly');
    const yearlyRate = computeWeightedRate(groups, totalStudents, 'yearly');

    const weeklyAvg = roundToDecimal(
        groups.reduce((sum, g) => sum + g.weekly.avgAttendance, 0),
        1
    );
    const monthlyAvg = roundToDecimal(
        groups.reduce((sum, g) => sum + g.monthly.avgAttendance, 0),
        1
    );
    const yearlyAvg = roundToDecimal(
        groups.reduce((sum, g) => sum + g.yearly.avgAttendance, 0),
        1
    );

    return (
        <TableRow className="border-t-2 font-bold">
            <TableCell>총계</TableCell>
            <TableCell className="text-center tabular-nums">{totalStudents}명</TableCell>
            <TableCell className="text-center tabular-nums">{weeklyRate}%</TableCell>
            <TableCell className="text-center tabular-nums">{monthlyRate}%</TableCell>
            <TableCell className="text-center tabular-nums">{yearlyRate}%</TableCell>
            <TableCell className="text-center tabular-nums">{weeklyAvg}명</TableCell>
            <TableCell className="text-center tabular-nums">{monthlyAvg}명</TableCell>
            <TableCell className="text-center tabular-nums">{yearlyAvg}명</TableCell>
        </TableRow>
    );
}

interface GroupStatisticsTableProps {
    data?: GroupStatisticsOutput;
    isLoading: boolean;
    error?: boolean;
}

export function GroupStatisticsTable({ data, isLoading, error }: GroupStatisticsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">학년별 통계</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : data && data.groups.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">학년명</TableHead>
                                <TableHead className="whitespace-nowrap text-center">인원</TableHead>
                                <TableHead className="whitespace-nowrap text-center">주간 출석률</TableHead>
                                <TableHead className="whitespace-nowrap text-center">월간 출석률</TableHead>
                                <TableHead className="whitespace-nowrap text-center">연간 출석률</TableHead>
                                <TableHead className="whitespace-nowrap text-center">주간 평균</TableHead>
                                <TableHead className="whitespace-nowrap text-center">월간 평균</TableHead>
                                <TableHead className="whitespace-nowrap text-center">연간 평균</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.groups.map((group) => (
                                <TableRow key={group.groupId}>
                                    <TableCell className="font-medium">{group.groupName}</TableCell>
                                    <TableCell className="text-center tabular-nums">{group.totalStudents}명</TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.weekly.attendanceRate}%
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.monthly.attendanceRate}%
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.yearly.attendanceRate}%
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.weekly.avgAttendance}명
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.monthly.avgAttendance}명
                                    </TableCell>
                                    <TableCell className="text-center tabular-nums">
                                        {group.yearly.avgAttendance}명
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TotalRow groups={data.groups} />
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                )}
            </CardContent>
        </Card>
    );
}
