import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CalendarCell } from './CalendarCell';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function CalendarGrid({ year, month, days, onDateClick }) {
    // 달력 그리드 생성 (6주 x 7일)
    const generateGrid = () => {
        const grid = [];
        // 해당 월 1일의 요일 (0=일요일)
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
        // 날짜 맵 생성
        const dayMap = new Map(days.map((d) => [d.date, d]));
        let dayIndex = 0;
        const totalDays = days.length;
        for (let week = 0; week < 6; week++) {
            const row = [];
            for (let weekday = 0; weekday < 7; weekday++) {
                if (week === 0 && weekday < firstDayOfMonth) {
                    // 이전 달 날짜
                    row.push(null);
                }
                else if (dayIndex < totalDays) {
                    const day = days[dayIndex];
                    row.push(dayMap.get(day.date) ?? null);
                    dayIndex++;
                }
                else {
                    // 다음 달 날짜
                    row.push(null);
                }
            }
            grid.push(row);
            // 모든 날짜가 채워졌고 다음 행이 모두 빈 경우 중단
            if (dayIndex >= totalDays && row.every((d) => d === null)) {
                grid.pop();
                break;
            }
        }
        return grid;
    };
    const grid = generateGrid();
    return (_jsxs("div", { className: "overflow-hidden rounded-xl border-2 shadow-sm", children: [_jsx("div", { className: "grid grid-cols-7 bg-muted/60", children: WEEKDAYS.map((day, index) => (_jsx("div", { className: `py-3 text-center text-sm font-semibold ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-foreground'}`, children: day }, day))) }), _jsx("div", { className: "divide-y", children: grid.map((week, weekIndex) => (_jsx("div", { className: "grid grid-cols-7 divide-x", children: week.map((day, dayIndex) => (_jsx(CalendarCell, { day: day, onClick: onDateClick }, day?.date ?? `empty-${weekIndex}-${dayIndex}`))) }, weekIndex))) })] }));
}
