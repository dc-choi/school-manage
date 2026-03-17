import { GROUP_TYPE, type GroupStatisticsItem, type GroupStatisticsOutput } from '@school/shared';
import { roundToDecimal } from '@school/utils';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Badge } from '~/components/ui/badge';
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
    const totalRegistered = groups.reduce((sum, g) => sum + g.registeredStudents, 0);

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
            <TableCell className="px-2 py-2 md:px-5 md:py-4">총계</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{totalStudents}명</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{totalRegistered}명</TableCell>
            <TableCell className="px-2 py-2 text-center tabular-nums md:px-5 md:py-4">{weeklyAvg}명</TableCell>
            <TableCell className="px-2 py-2 text-center tabular-nums md:px-5 md:py-4">{monthlyAvg}명</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{yearlyAvg}명</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{weeklyRate}%</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{monthlyRate}%</TableCell>
            <TableCell className="hidden text-center tabular-nums md:table-cell">{yearlyRate}%</TableCell>
        </TableRow>
    );
}

interface GroupStatisticsTableProps {
    data?: GroupStatisticsOutput;
    isLoading: boolean;
    error?: boolean;
    className?: string;
}

function GroupStatisticsContent({ data, isLoading, error }: GroupStatisticsTableProps) {
    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }
    if (error) return <p className="text-sm text-destructive">데이터 로드 실패</p>;
    if (data && data.groups.length > 0) {
        return (
            <Table className="text-sm md:min-w-[600px] md:text-base">
                <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm">
                    <TableRow>
                        <TableHead className="h-10 whitespace-nowrap px-2 md:h-14 md:px-5">학년명</TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">총 인원</TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">등록 인원</TableHead>
                        <TableHead className="h-10 whitespace-nowrap px-2 text-center md:h-14 md:px-5">
                            주간 평균
                        </TableHead>
                        <TableHead className="h-10 whitespace-nowrap px-2 text-center md:h-14 md:px-5">
                            월간 평균
                        </TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">연간 평균</TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">
                            주간 출석률
                        </TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">
                            월간 출석률
                        </TableHead>
                        <TableHead className="hidden whitespace-nowrap text-center md:table-cell">
                            연간 출석률
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.groups.map((group) => (
                        <TableRow key={group.groupId}>
                            <TableCell className="px-2 py-2 font-medium md:px-5 md:py-4">
                                {group.groupName}
                                <Badge
                                    variant={group.groupType === GROUP_TYPE.GRADE ? 'default' : 'secondary'}
                                    className="ml-2 hidden md:inline-flex"
                                >
                                    {group.groupType === GROUP_TYPE.GRADE ? '학년' : '부서'}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.totalStudents}명
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.registeredStudents}명
                            </TableCell>
                            <TableCell className="px-2 py-2 text-center tabular-nums md:px-5 md:py-4">
                                {group.weekly.avgAttendance}명
                            </TableCell>
                            <TableCell className="px-2 py-2 text-center tabular-nums md:px-5 md:py-4">
                                {group.monthly.avgAttendance}명
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.yearly.avgAttendance}명
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.weekly.attendanceRate}%
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.monthly.attendanceRate}%
                            </TableCell>
                            <TableCell className="hidden text-center tabular-nums md:table-cell">
                                {group.yearly.attendanceRate}%
                            </TableCell>
                        </TableRow>
                    ))}
                    <TotalRow groups={data.groups} />
                </TableBody>
            </Table>
        );
    }
    return <p className="text-sm text-muted-foreground">데이터 없음</p>;
}

export function GroupStatisticsTable({ data, isLoading, error, className }: GroupStatisticsTableProps) {
    return (
        <Card className={`flex flex-col ${className ?? ''}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">학년별 통계</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto">
                <GroupStatisticsContent data={data} isLoading={isLoading} error={error} />
            </CardContent>
        </Card>
    );
}
