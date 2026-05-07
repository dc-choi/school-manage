import { GROUP_TYPE } from '@school/shared';
import { AlertCircle, Check, Loader2, RefreshCw, Trophy, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select';
import { useAttendance } from '~/features/attendance';
import { type SortKey, sortStudents } from '~/features/attendance/utils/sortStudents';
import { useGroups } from '~/features/group';
import { analytics } from '~/lib/analytics';
import { cn } from '~/lib/utils';

const ATTENDANCE_OPTIONS = [
    { value: '', label: '-' },
    { value: '◎', label: '◎' },
    { value: '○', label: '○' },
    { value: '△', label: '△' },
];

interface SortOption {
    value: SortKey;
    label: string;
}

const SORT_OPTIONS: SortOption[] = [
    { value: 'registration', label: '등록 순' },
    { value: 'name', label: '가나다 순' },
    { value: 'top_attendance', label: '우수 출석 순' },
];

const TOP_RANK_HIGHLIGHT_LIMIT = 3;

const getSortStorageKey = (groupId: string, year: number): string => `attendance_sort_${groupId}_${year}`;

const isValidSortKey = (value: string): value is SortKey =>
    value === 'registration' || value === 'name' || value === 'top_attendance';

export function AttendancePage() {
    const currentYear = new Date().getFullYear();
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [sortKey, setSortKey] = useState<SortKey>('registration');

    const groupSelectId = useId();
    const yearSelectId = useId();
    const sortSelectId = useId();

    const { groups, isLoading: groupsLoading } = useGroups();

    useEffect(() => {
        if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    const {
        data: attendanceData,
        isLoading: attendanceLoading,
        enqueueChange,
        retryCell,
        retryAllFailed,
        failedCells,
        saveStatus,
    } = useAttendance(selectedGroupId, selectedYear);

    useEffect(() => {
        if (!selectedGroupId) return;
        if (typeof window === 'undefined') return;
        const stored = window.sessionStorage.getItem(getSortStorageKey(selectedGroupId, selectedYear));
        if (stored && isValidSortKey(stored)) {
            setSortKey(stored);
        } else {
            setSortKey('registration');
        }
    }, [selectedGroupId, selectedYear]);

    const handleSortChange = (value: string) => {
        if (!isValidSortKey(value)) return;
        setSortKey(value);
        if (selectedGroupId && typeof window !== 'undefined') {
            window.sessionStorage.setItem(getSortStorageKey(selectedGroupId, selectedYear), value);
        }
        analytics.trackAttendanceSortClicked(value);
    };

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, string>();
        attendanceData?.attendances?.forEach((a) => {
            map.set(`${a.studentId}-${a.date}`, a.content);
        });
        return map;
    }, [attendanceData]);

    const sortedStudents = useMemo(() => {
        if (!attendanceData?.students) return [];
        return sortStudents(attendanceData.students, attendanceData.attendances ?? [], sortKey);
    }, [attendanceData, sortKey]);

    const dates = useMemo(() => {
        const result: { date: string; month: number; day: number; dayOfWeek: string }[] = [];
        if (!attendanceData?.sunday || !attendanceData?.saturday) return result;

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

    const getAttendanceValue = (studentId: string, date: string) => {
        const key = `${studentId}-${date}`;
        return attendanceMap.get(key) || '';
    };

    const cellKey = (studentId: string, month: number, day: number) => `${studentId}-${month}-${day}`;

    if (groupsLoading) {
        return (
            <MainLayout title="출석부">
                <LoadingSpinner />
            </MainLayout>
        );
    }

    return (
        <MainLayout title="출석부">
            <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-3 md:h-[calc(100dvh-7.5rem)]">
                {/* 컨트롤 영역 */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <Label htmlFor={groupSelectId} className="text-xs">
                                학년/부서
                            </Label>
                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger id={groupSelectId} className="h-9 w-32">
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>학년</SelectLabel>
                                        {groups
                                            .filter((g) => g.type === GROUP_TYPE.GRADE)
                                            .map((g) => (
                                                <SelectItem key={g.id} value={g.id}>
                                                    {g.name}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                    {groups.some((g) => g.type === GROUP_TYPE.DEPARTMENT) ? (
                                        <>
                                            <SelectSeparator />
                                            <SelectGroup>
                                                <SelectLabel>부서</SelectLabel>
                                                {groups
                                                    .filter((g) => g.type === GROUP_TYPE.DEPARTMENT)
                                                    .map((g) => (
                                                        <SelectItem key={g.id} value={g.id}>
                                                            {g.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectGroup>
                                        </>
                                    ) : null}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={yearSelectId} className="text-xs">
                                연도
                            </Label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(value) => setSelectedYear(Number(value))}
                            >
                                <SelectTrigger id={yearSelectId} className="h-9 w-32">
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
                        <div className="space-y-1">
                            <Label htmlFor={sortSelectId} className="text-xs">
                                정렬
                            </Label>
                            <Select value={sortKey} onValueChange={handleSortChange}>
                                <SelectTrigger id={sortSelectId} className="h-9 w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 저장 상태 인디케이터 (헤더 우상단 통합) */}
                    <div aria-live="polite" className="flex items-center gap-2 text-sm">
                        {saveStatus === 'in-flight' && (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                <span>저장 중...</span>
                            </>
                        )}
                        {saveStatus === 'ok' && (
                            <>
                                <Check className="h-4 w-4 text-green-700" aria-hidden="true" />
                                <span className="text-green-700">저장 완료</span>
                            </>
                        )}
                        {saveStatus === 'partial-error' && (
                            <>
                                <X className="h-4 w-4 text-red-700" aria-hidden="true" />
                                <span className="text-red-700">일부 저장 실패</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 px-2"
                                    onClick={() => retryAllFailed()}
                                >
                                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                                    전부 재시도
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* 테이블 영역 */}
                {!selectedGroupId ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <CardContent className="text-center text-muted-foreground">학년을 선택해주세요.</CardContent>
                    </Card>
                ) : null}
                {selectedGroupId && attendanceLoading ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <LoadingSpinner />
                    </Card>
                ) : null}
                {selectedGroupId && !attendanceLoading && !sortedStudents.length ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <CardContent className="text-center text-muted-foreground">학생이 없습니다.</CardContent>
                    </Card>
                ) : null}
                {selectedGroupId && !attendanceLoading && sortedStudents.length ? (
                    <Card className="min-h-0 flex-1">
                        <CardContent className="h-full overflow-auto p-0">
                            <table className="min-w-full border-collapse">
                                <thead className="sticky top-0 z-20">
                                    <tr className="border-b bg-muted/80 backdrop-blur-sm">
                                        <th className="sticky left-0 z-30 border-r bg-muted/80 px-3 py-2 text-left text-sm font-semibold backdrop-blur-sm">
                                            이름
                                        </th>
                                        {dates.map((d) => (
                                            <th
                                                key={d.date}
                                                className="border-r px-2 py-1 text-center text-xs font-medium tabular-nums"
                                            >
                                                <div>
                                                    {d.month}/{d.day}
                                                </div>
                                                <span
                                                    className={cn(
                                                        'mt-0.5 inline-flex items-center rounded border px-1 text-[10px]',
                                                        d.dayOfWeek === '일'
                                                            ? 'border-red-200 bg-red-50 text-red-700'
                                                            : 'border-border bg-background text-muted-foreground'
                                                    )}
                                                >
                                                    {d.dayOfWeek}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map((student, index) => {
                                        const showRankBadge =
                                            sortKey === 'top_attendance' && index < TOP_RANK_HIGHLIGHT_LIMIT;
                                        return (
                                            <tr
                                                key={student.id}
                                                className="border-b hover:bg-muted/30 focus-within:bg-muted/40 last:border-b-0"
                                            >
                                                <td className="sticky left-0 z-10 border-r bg-background px-3 py-1.5 text-sm font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        {showRankBadge ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="gap-1 px-1.5 text-[10px]"
                                                            >
                                                                <Trophy
                                                                    className="h-3 w-3 text-amber-600"
                                                                    aria-hidden="true"
                                                                />
                                                                {index + 1}
                                                            </Badge>
                                                        ) : null}
                                                        {student.societyName}
                                                    </span>
                                                </td>
                                                {dates.map((d) => {
                                                    const key = cellKey(student.id, d.month, d.day);
                                                    const failed = failedCells.has(key);
                                                    return (
                                                        <td
                                                            key={d.date}
                                                            className={cn(
                                                                'border-r p-0',
                                                                failed &&
                                                                    'bg-destructive/10 ring-1 ring-destructive/40 ring-inset'
                                                            )}
                                                        >
                                                            <select
                                                                aria-label={`${student.societyName} ${d.month}월 ${d.day}일 ${d.dayOfWeek}요일 출석`}
                                                                value={getAttendanceValue(student.id, d.date)}
                                                                onChange={(e) =>
                                                                    enqueueChange(
                                                                        student.id,
                                                                        d.month,
                                                                        d.day,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                onDoubleClick={
                                                                    failed ? () => retryCell(key) : undefined
                                                                }
                                                                className="w-full border-0 bg-transparent px-1 py-1.5 text-center text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            >
                                                                {ATTENDANCE_OPTIONS.map((opt) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {failed ? (
                                                                <span
                                                                    className="pointer-events-none absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center text-destructive"
                                                                    aria-hidden="true"
                                                                >
                                                                    <AlertCircle className="h-3 w-3" />
                                                                </span>
                                                            ) : null}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </MainLayout>
    );
}
