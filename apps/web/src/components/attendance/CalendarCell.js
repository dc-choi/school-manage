import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '~/lib/utils';
export function CalendarCell({ day, onClick }) {
    if (!day) {
        // 빈 셀 (이전/다음 달 날짜)
        return _jsx("div", { className: "h-24 bg-muted/20 sm:h-28" });
    }
    const { date, dayOfWeek, attendance, holyday } = day;
    const dayNumber = parseInt(date.split('-')[2], 10);
    // 스타일 결정
    const isHolyday = !!holyday;
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isFullAttendance = attendance.total > 0 && attendance.present === attendance.total;
    const hasAttendance = attendance.present > 0;
    const attendanceRate = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;
    return (_jsxs("div", { onClick: () => onClick?.(date), className: cn('group relative h-24 cursor-pointer p-2 transition-all hover:bg-accent/50 sm:h-28 sm:p-3', isHolyday && 'bg-red-50/80 hover:bg-red-100/80', !isHolyday && isSunday && 'bg-rose-50/40', !isHolyday && isSaturday && 'bg-blue-50/40'), children: [_jsx("div", { className: cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-8 sm:w-8', isHolyday && 'bg-red-100 text-red-700', !isHolyday && isSunday && 'text-red-500 group-hover:bg-red-100', !isHolyday && isSaturday && 'text-blue-500 group-hover:bg-blue-100', !isHolyday && !isSunday && !isSaturday && 'group-hover:bg-muted'), children: dayNumber }), attendance.total > 0 && (_jsxs("div", { className: "mt-1 space-y-1", children: [_jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: cn('h-full rounded-full transition-all', isFullAttendance ? 'bg-green-500' : hasAttendance ? 'bg-amber-500' : 'bg-muted'), style: { width: `${attendanceRate}%` } }) }), _jsxs("div", { className: cn('text-center text-xs font-medium', isFullAttendance && 'text-green-600', !isFullAttendance && hasAttendance && 'text-amber-600', !hasAttendance && 'text-muted-foreground'), children: [attendance.present, "/", attendance.total] })] })), isHolyday && (_jsx("div", { className: "absolute bottom-1 left-1 right-1 truncate rounded bg-red-100 px-1 py-0.5 text-center text-[10px] font-medium text-red-700 sm:bottom-2 sm:left-2 sm:right-2", children: holyday }))] }));
}
