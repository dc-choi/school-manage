import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { AttendanceModal } from '~/components/attendance/AttendanceModal';
import { CalendarGrid } from '~/components/attendance/CalendarGrid';
import { CalendarHeader } from '~/components/attendance/CalendarHeader';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
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
    const { data: calendarData, isLoading: calendarLoading, updateAttendance, refreshCalendar, } = useCalendar(selectedGroupId, currentYear, currentMonth);
    // 날짜별 출석 상세 조회 (모달용) - 모달이 열릴 때만 조회
    const { data: dayDetailData, isLoading: dayDetailLoading, refreshDayDetail, } = useDayDetail(selectedGroupId, selectedDate, isModalOpen && !!selectedDate);
    // 월 이동
    const handlePrevMonth = useCallback(() => {
        if (currentMonth === 1) {
            setCurrentYear((y) => y - 1);
            setCurrentMonth(12);
        }
        else {
            setCurrentMonth((m) => m - 1);
        }
    }, [currentMonth]);
    const handleNextMonth = useCallback(() => {
        if (currentMonth === 12) {
            setCurrentYear((y) => y + 1);
            setCurrentMonth(1);
        }
        else {
            setCurrentMonth((m) => m + 1);
        }
    }, [currentMonth]);
    // 날짜 클릭 → 모달 오픈
    const handleDateClick = useCallback((date) => {
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
    const handleSave = useCallback(async (data, isFull) => {
        await updateAttendance(data, isFull);
        // 날짜별 상세 데이터도 갱신
        await refreshDayDetail();
    }, [updateAttendance, refreshDayDetail]);
    if (groupsLoading) {
        return (_jsx(MainLayout, { title: "\uCD9C\uC11D\uBD80 \uB2EC\uB825", children: _jsx("div", { className: "flex h-64 items-center justify-center", children: _jsx(LoadingSpinner, {}) }) }));
    }
    return (_jsxs(MainLayout, { title: "\uCD9C\uC11D\uBD80 \uB2EC\uB825", children: [_jsxs("div", { className: "space-y-8", children: [_jsx(Card, { children: _jsx(CardContent, { className: "py-6", children: _jsxs("div", { className: "flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "\uADF8\uB8F9 \uC120\uD0DD" }), _jsxs(Select, { value: selectedGroupId, onValueChange: (value) => {
                                                    setSelectedGroupId(value);
                                                }, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "\uADF8\uB8F9\uC744 \uC120\uD0DD\uD558\uC138\uC694" }) }), _jsx(SelectContent, { children: groups.map((g) => (_jsx(SelectItem, { value: g.id, children: g.name }, g.id))) })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "\uCD9C\uC11D \uD45C\uC2DC:" }), _jsxs(Badge, { variant: "outline", className: "gap-1 px-3 py-1", children: [_jsx("span", { className: "text-green-600", children: "\u25CE" }), " \uCD9C\uC11D"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 px-3 py-1", children: [_jsx("span", { className: "text-blue-600", children: "\u25CB" }), " \uBBF8\uC0AC\uB9CC"] }), _jsxs(Badge, { variant: "outline", className: "gap-1 px-3 py-1", children: [_jsx("span", { className: "text-orange-600", children: "\u25B3" }), " \uAD50\uB9AC\uB9CC"] })] })] }) }) }), !selectedGroupId ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex h-96 items-center justify-center", children: _jsx("p", { className: "text-lg text-muted-foreground", children: "\uADF8\uB8F9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." }) }) })) : calendarLoading ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex h-96 items-center justify-center", children: _jsx(LoadingSpinner, {}) }) })) : !calendarData ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex h-96 items-center justify-center", children: _jsx("p", { className: "text-lg text-muted-foreground", children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }) }) })) : (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-4", children: _jsx(CalendarHeader, { year: currentYear, month: currentMonth, onPrevMonth: handlePrevMonth, onNextMonth: handleNextMonth }) }), _jsxs(CardContent, { className: "px-6 pb-8", children: [_jsx(CalendarGrid, { year: currentYear, month: currentMonth, days: calendarData.days, onDateClick: handleDateClick }), calendarData.totalStudents > 0 && (_jsx("div", { className: "mt-6 flex justify-center", children: _jsxs(Badge, { variant: "secondary", className: "px-4 py-2 text-sm", children: ["\uC804\uCCB4 \uD559\uC0DD \uC218: ", calendarData.totalStudents, "\uBA85"] }) }))] })] }))] }), _jsx(AttendanceModal, { isOpen: isModalOpen, onClose: handleModalClose, date: selectedDate, holyday: dayDetailData?.holyday ?? null, students: dayDetailData?.students ?? [], isLoading: dayDetailLoading, onSave: handleSave, year: currentYear })] }));
}
