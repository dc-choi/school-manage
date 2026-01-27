import type { AttendanceData } from '@school/trpc';
import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useAttendance } from '~/features/attendance';
import { useGroups } from '~/features/group';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 출석 상태 옵션
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
 */
const ATTENDANCE_OPTIONS = [
    { value: '', label: '-' },
    { value: '◎', label: '◎' },
    { value: '○', label: '○' },
    { value: '△', label: '△' },
];

export function AttendancePage() {
    const currentYear = new Date().getFullYear();
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    const { groups, isLoading: groupsLoading } = useGroups();

    // 그룹 로드 완료 시 첫 번째 그룹 자동 선택
    useEffect(() => {
        if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    const {
        data: attendanceData,
        isLoading: attendanceLoading,
        updateAttendance,
    } = useAttendance(selectedGroupId, selectedYear);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

    // 출석 데이터를 학생-날짜 맵으로 변환
    const attendanceMap = useMemo(() => {
        const map = new Map<string, string>();
        attendanceData?.attendances?.forEach((a) => {
            map.set(`${a.studentId}-${a.date}`, a.content);
        });
        return map;
    }, [attendanceData]);

    // 날짜 목록 생성 (일요일과 토요일)
    const dates = useMemo(() => {
        const result: { date: string; month: number; day: number; dayOfWeek: string }[] = [];
        if (!attendanceData?.sunday || !attendanceData?.saturday) return result;

        // 일요일
        attendanceData.sunday.forEach((monthData, monthIndex) => {
            monthData.forEach((day) => {
                result.push({
                    date: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                    month: monthIndex + 1,
                    day,
                    dayOfWeek: '일',
                });
            });
        });

        // 토요일
        attendanceData.saturday.forEach((monthData, monthIndex) => {
            monthData.forEach((day) => {
                result.push({
                    date: `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                    month: monthIndex + 1,
                    day,
                    dayOfWeek: '토',
                });
            });
        });

        return result.sort((a, b) => a.date.localeCompare(b.date));
    }, [attendanceData, selectedYear]);

    // 출석 변경 핸들러 (자동 저장)
    const handleAttendanceChange = useCallback(
        async (studentId: string, month: number, day: number, value: string) => {
            // 빈 값이면 저장하지 않음
            if (!value) return;

            setSaveStatus('saving');

            try {
                const data: AttendanceData = {
                    id: studentId,
                    month,
                    day,
                    data: value,
                };

                await updateAttendance([data], false);

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('저장 실패:', error);
                setSaveStatus('error');
            }
        },
        [updateAttendance]
    );

    const getAttendanceValue = (studentId: string, date: string) => {
        const key = `${studentId}-${date}`;
        return attendanceMap.get(key) || '';
    };

    if (groupsLoading) {
        return (
            <MainLayout title="출석부">
                <LoadingSpinner />
            </MainLayout>
        );
    }

    return (
        <MainLayout title="출석부">
            <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <div className="grid grid-cols-2 gap-6 sm:flex sm:gap-6">
                    <div className="space-y-2">
                        <Label>그룹</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="그룹 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>연도</Label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(Number(value))}
                        >
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y.value} value={y.value}>
                                        {y.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 저장 상태 인디케이터 */}
                <div className="flex items-center gap-2 text-sm">
                    {saveStatus === 'saving' && (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>저장 중...</span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">저장 완료</span>
                        </>
                    )}
                    {saveStatus === 'error' && (
                        <>
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">저장 실패</span>
                        </>
                    )}
                </div>
            </div>

            {!selectedGroupId ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">그룹을 선택해주세요.</CardContent>
                </Card>
            ) : attendanceLoading ? (
                <LoadingSpinner />
            ) : !attendanceData?.students?.length ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">학생이 없습니다.</CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="overflow-x-auto p-4">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="sticky left-0 z-10 border-r bg-muted/50 px-3 py-2 text-left text-sm font-semibold">
                                        이름
                                    </th>
                                    {dates.map((d) => (
                                        <th key={d.date} className="border-r px-2 py-1 text-center text-xs font-medium">
                                            <div>
                                                {d.month}/{d.day}
                                            </div>
                                            <Badge
                                                variant={d.dayOfWeek === '일' ? 'destructive' : 'default'}
                                                className="mt-1 text-[10px]"
                                            >
                                                {d.dayOfWeek}
                                            </Badge>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.students.map((student) => (
                                    <tr key={student.id} className="border-b last:border-b-0">
                                        <td className="sticky left-0 z-10 border-r bg-background px-3 py-2 text-sm font-medium">
                                            {student.societyName}
                                        </td>
                                        {dates.map((d) => (
                                            <td key={d.date} className="border-r p-0">
                                                <select
                                                    value={getAttendanceValue(student.id, d.date)}
                                                    onChange={(e) =>
                                                        handleAttendanceChange(
                                                            student.id,
                                                            d.month,
                                                            d.day,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border-0 bg-transparent px-1 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                >
                                                    {ATTENDANCE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </MainLayout>
    );
}
