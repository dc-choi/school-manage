import { CalendarCell } from './CalendarCell';
import type { CalendarDay } from '@school/trpc';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getWeekdayColor = (index: number): string => {
    if (index === 0) return 'text-red-500';
    if (index === 6) return 'text-blue-500';
    return 'text-foreground';
};

interface CalendarGridProps {
    year: number;
    month: number;
    days: CalendarDay[];
    onDateClick: (date: string) => void;
}

export function CalendarGrid({ year, month, days, onDateClick }: CalendarGridProps) {
    // 달력 그리드 생성 (6주 x 7일)
    const generateGrid = (): (CalendarDay | null)[][] => {
        const grid: (CalendarDay | null)[][] = [];

        // 해당 월 1일의 요일 (0=일요일)
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

        // 날짜 맵 생성
        const dayMap = new Map(days.map((d) => [d.date, d]));

        let dayIndex = 0;
        const totalDays = days.length;

        for (let week = 0; week < 6; week++) {
            const row: (CalendarDay | null)[] = [];

            for (let weekday = 0; weekday < 7; weekday++) {
                if (week === 0 && weekday < firstDayOfMonth) {
                    // 이전 달 날짜
                    row.push(null);
                } else if (dayIndex < totalDays) {
                    const day = days[dayIndex];
                    row.push(dayMap.get(day.date) ?? null);
                    dayIndex++;
                } else {
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

    return (
        <div className="overflow-hidden rounded-xl border-2 shadow-sm">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-muted/60">
                {WEEKDAYS.map((day, index) => (
                    <div key={day} className={`py-3 text-center text-sm font-semibold ${getWeekdayColor(index)}`}>
                        {day}
                    </div>
                ))}
            </div>

            {/* 달력 그리드 */}
            <div className="divide-y">
                {grid.map((week, weekIndex) => (
                    <div key={week[0]?.date ?? `week-${weekIndex}`} className="grid grid-cols-7 divide-x">
                        {week.map((day, dayIndex) => (
                            <CalendarCell
                                key={day?.date ?? `empty-${weekIndex}-${dayIndex}`}
                                day={day}
                                onClick={onDateClick}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
