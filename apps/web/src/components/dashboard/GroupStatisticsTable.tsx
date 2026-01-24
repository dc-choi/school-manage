import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import type { GroupStatisticsOutput } from '@school/trpc';

interface GroupStatisticsTableProps {
    data?: GroupStatisticsOutput;
    isLoading: boolean;
    error?: boolean;
}

export function GroupStatisticsTable({ data, isLoading, error }: GroupStatisticsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">그룹별 통계</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : data && data.groups.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">그룹명</TableHead>
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
                                        <TableCell className="text-center">{group.totalStudents}명</TableCell>
                                        <TableCell className="text-center">{group.weekly.attendanceRate}%</TableCell>
                                        <TableCell className="text-center">{group.monthly.attendanceRate}%</TableCell>
                                        <TableCell className="text-center">{group.yearly.attendanceRate}%</TableCell>
                                        <TableCell className="text-center">{group.weekly.avgAttendance}명</TableCell>
                                        <TableCell className="text-center">{group.monthly.avgAttendance}명</TableCell>
                                        <TableCell className="text-center">{group.yearly.avgAttendance}명</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                )}
            </CardContent>
        </Card>
    );
}