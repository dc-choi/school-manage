import { AttendanceModal } from './AttendanceModal';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { type AttendanceData, GROUP_TYPE } from '@school/shared';
import { useCallback, useEffect, useState } from 'react';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
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
import { useCalendar, useDayDetail } from '~/features/attendance';
import { useGroups } from '~/features/group';

export function CalendarPage() {
    const currentDate = new Date();
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    const { groups, isLoading: groupsLoading } = useGroups();

    // 그룹 로드 완료 시 첫 번째 그룹 자동 선택
    useEffect(() => {
        if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);

    // 달력 데이터 조회
    const {
        data: calendarData,
        isLoading: calendarLoading,
        updateAttendance,
        refreshCalendar,
    } = useCalendar(selectedGroupId, currentYear, currentMonth);

    // 날짜별 출석 상세 조회 (모달용) - 모달이 열릴 때만 조회
    const {
        data: dayDetailData,
        isLoading: dayDetailLoading,
        refreshDayDetail,
    } = useDayDetail(selectedGroupId, selectedDate, isModalOpen && !!selectedDate);

    // 월 이동
    const handlePrevMonth = useCallback(() => {
        if (currentMonth === 1) {
            setCurrentYear((y) => y - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    }, [currentMonth]);

    const handleNextMonth = useCallback(() => {
        if (currentMonth === 12) {
            setCurrentYear((y) => y + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    }, [currentMonth]);

    // 날짜 클릭 → 모달 오픈
    const handleDateClick = useCallback((date: string) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    }, []);

    // 모달 닫기 → 달력 갱신
    const handleModalClose = useCallback(async () => {
        setIsModalOpen(false);
        setSelectedDate('');
        // 달력 데이터 갱신
        await refreshCalendar();
    }, [refreshCalendar]);

    // 출석 저장 핸들러
    const handleSave = useCallback(
        async (data: AttendanceData[], isFull: boolean) => {
            await updateAttendance(data, isFull);
            // 날짜별 상세 데이터도 갱신
            await refreshDayDetail();
        },
        [updateAttendance, refreshDayDetail]
    );

    if (groupsLoading) {
        return (
            <MainLayout title="출석부 달력">
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="출석부 달력">
            <div className="flex h-[calc(100vh-6.5rem)] flex-col gap-3 md:h-[calc(100vh-7.5rem)]">
                {/* 컨트롤 영역 */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">학년&부서</span>
                        <Select
                            value={selectedGroupId}
                            onValueChange={(value) => {
                                setSelectedGroupId(value);
                            }}
                        >
                            <SelectTrigger className="h-9 w-40">
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
                        {calendarData && calendarData.totalStudents > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                                {calendarData.totalStudents}명
                            </Badge>
                        ) : null}
                    </div>

                    {/* 범례 */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
                            <span className="text-green-600">◎</span> 출석
                        </Badge>
                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
                            <span className="text-blue-600">○</span> 미사만
                        </Badge>
                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
                            <span className="text-orange-600">△</span> 교리만
                        </Badge>
                    </div>
                </div>

                {/* 달력 영역 — 나머지 높이를 모두 채움 */}
                {!selectedGroupId ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <p className="text-lg text-muted-foreground">학년을 선택해주세요.</p>
                    </Card>
                ) : null}
                {selectedGroupId && calendarLoading ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <LoadingSpinner />
                    </Card>
                ) : null}
                {selectedGroupId && !calendarLoading && !calendarData ? (
                    <Card className="flex flex-1 items-center justify-center">
                        <p className="text-lg text-muted-foreground">데이터를 불러올 수 없습니다.</p>
                    </Card>
                ) : null}
                {selectedGroupId && !calendarLoading && calendarData ? (
                    <Card className="flex min-h-0 flex-1 flex-col overflow-auto">
                        <CardHeader className="pb-2 pt-4">
                            <CalendarHeader
                                year={currentYear}
                                month={currentMonth}
                                onPrevMonth={handlePrevMonth}
                                onNextMonth={handleNextMonth}
                            />
                        </CardHeader>
                        <CardContent className="flex-1 px-4 pb-4">
                            <CalendarGrid
                                year={currentYear}
                                month={currentMonth}
                                days={calendarData.days}
                                onDateClick={handleDateClick}
                            />
                        </CardContent>
                    </Card>
                ) : null}
            </div>

            {/* 출석 입력 모달 */}
            <AttendanceModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                date={selectedDate}
                holyday={dayDetailData?.holyday ?? null}
                students={dayDetailData?.students ?? []}
                isLoading={dayDetailLoading}
                onSave={handleSave}
                year={currentYear}
            />
        </MainLayout>
    );
}
