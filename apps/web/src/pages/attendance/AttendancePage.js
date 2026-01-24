import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const ATTENDANCE_OPTIONS = [
    { value: '', label: '-' },
    { value: 'O', label: 'O' },
    { value: 'X', label: 'X' },
    { value: '?', label: '?' },
];
export function AttendancePage() {
    const currentYear = new Date().getFullYear();
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [saveStatus, setSaveStatus] = useState('idle');
    const { groups, isLoading: groupsLoading } = useGroups();
    // 그룹 로드 완료 시 첫 번째 그룹 자동 선택
    useEffect(() => {
        if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId]);
    const { data: attendanceData, isLoading: attendanceLoading, updateAttendance, } = useAttendance(selectedGroupId, selectedYear);
    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);
    // 출석 데이터를 학생-날짜 맵으로 변환
    const attendanceMap = useMemo(() => {
        const map = new Map();
        attendanceData?.attendances?.forEach((a) => {
            map.set(`${a.studentId}-${a.date}`, a.content);
        });
        return map;
    }, [attendanceData]);
    // 날짜 목록 생성 (일요일과 토요일)
    const dates = useMemo(() => {
        const result = [];
        if (!attendanceData?.sunday || !attendanceData?.saturday)
            return result;
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
    const handleAttendanceChange = useCallback(async (studentId, month, day, value) => {
        // 빈 값이면 저장하지 않음
        if (!value)
            return;
        setSaveStatus('saving');
        try {
            const data = {
                id: studentId,
                month,
                day,
                data: value,
            };
            await updateAttendance([data], false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
        catch (error) {
            console.error('저장 실패:', error);
            setSaveStatus('error');
        }
    }, [updateAttendance]);
    const getAttendanceValue = (studentId, date) => {
        const key = `${studentId}-${date}`;
        return attendanceMap.get(key) || '';
    };
    if (groupsLoading) {
        return (_jsx(MainLayout, { title: "\uCD9C\uC11D\uBD80", children: _jsx(LoadingSpinner, {}) }));
    }
    return (_jsxs(MainLayout, { title: "\uCD9C\uC11D\uBD80", children: [_jsxs("div", { className: "mb-6 flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between", children: [_jsxs("div", { className: "grid grid-cols-2 gap-6 sm:flex sm:gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\uADF8\uB8F9" }), _jsxs(Select, { value: selectedGroupId, onValueChange: setSelectedGroupId, children: [_jsx(SelectTrigger, { className: "w-full sm:w-40", children: _jsx(SelectValue, { placeholder: "\uADF8\uB8F9 \uC120\uD0DD" }) }), _jsx(SelectContent, { children: groups.map((g) => (_jsx(SelectItem, { value: g.id, children: g.name }, g.id))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\uC5F0\uB3C4" }), _jsxs(Select, { value: selectedYear.toString(), onValueChange: (value) => setSelectedYear(Number(value)), children: [_jsx(SelectTrigger, { className: "w-full sm:w-32", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: yearOptions.map((y) => (_jsx(SelectItem, { value: y.value, children: y.label }, y.value))) })] })] })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [saveStatus === 'saving' && (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), _jsx("span", { children: "\uC800\uC7A5 \uC911..." })] })), saveStatus === 'saved' && (_jsxs(_Fragment, { children: [_jsx(Check, { className: "h-4 w-4 text-green-600" }), _jsx("span", { className: "text-green-600", children: "\uC800\uC7A5 \uC644\uB8CC" })] })), saveStatus === 'error' && (_jsxs(_Fragment, { children: [_jsx(X, { className: "h-4 w-4 text-red-600" }), _jsx("span", { className: "text-red-600", children: "\uC800\uC7A5 \uC2E4\uD328" })] }))] })] }), !selectedGroupId ? (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "\uADF8\uB8F9\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." }) })) : attendanceLoading ? (_jsx(LoadingSpinner, {})) : !attendanceData?.students?.length ? (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center text-muted-foreground", children: "\uD559\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }) })) : (_jsx(Card, { children: _jsx(CardContent, { className: "overflow-x-auto p-4", children: _jsxs("table", { className: "min-w-full border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b bg-muted/50", children: [_jsx("th", { className: "sticky left-0 z-10 border-r bg-muted/50 px-3 py-2 text-left text-sm font-semibold", children: "\uC774\uB984" }), dates.map((d) => (_jsxs("th", { className: "border-r px-2 py-1 text-center text-xs font-medium", children: [_jsxs("div", { children: [d.month, "/", d.day] }), _jsx(Badge, { variant: d.dayOfWeek === '일' ? 'destructive' : 'default', className: "mt-1 text-[10px]", children: d.dayOfWeek })] }, d.date)))] }) }), _jsx("tbody", { children: attendanceData.students.map((student) => (_jsxs("tr", { className: "border-b last:border-b-0", children: [_jsx("td", { className: "sticky left-0 z-10 border-r bg-background px-3 py-2 text-sm font-medium", children: student.societyName }), dates.map((d) => (_jsx("td", { className: "border-r p-0", children: _jsx("select", { value: getAttendanceValue(student.id, d.date), onChange: (e) => handleAttendanceChange(student.id, d.month, d.day, e.target.value), className: "w-full border-0 bg-transparent px-1 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring", children: ATTENDANCE_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }) }, d.date)))] }, student.id))) })] }) }) }))] }));
}
