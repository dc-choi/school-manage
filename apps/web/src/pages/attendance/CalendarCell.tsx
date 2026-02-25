import type { CalendarDay } from '@school/trpc';
import { cn } from '~/lib/utils';

interface CalendarCellProps {
    day: CalendarDay | null;
    onClick?: (date: string) => void;
}

const getBarColor = (isFullAttendance: boolean, hasAttendance: boolean) => {
    if (isFullAttendance) return 'bg-green-500';
    if (hasAttendance) return 'bg-amber-500';
    return 'bg-muted';
};

const getTextColor = (isFullAttendance: boolean, hasAttendance: boolean) => {
    if (isFullAttendance) return 'text-green-600';
    if (hasAttendance) return 'text-amber-600';
    return 'text-muted-foreground';
};

export function CalendarCell({ day, onClick }: Readonly<CalendarCellProps>) {
    if (!day) {
        return <div className="h-24 bg-muted/20 sm:h-28" />;
    }

    const { date, dayOfWeek, attendance, holyday } = day;
    const dayNumber = Number.parseInt(date.split('-')[2], 10);

    const isHolyday = !!holyday;
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isFullAttendance = attendance.total > 0 && attendance.present === attendance.total;
    const hasAttendance = attendance.present > 0;
    const attendanceRate = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;

    return (
        <button
            type="button"
            onClick={() => onClick?.(date)}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.(date)}
            className={cn(
                'group relative h-24 w-full cursor-pointer p-2 text-left transition-all hover:bg-accent/50 sm:h-28 sm:p-3',
                isHolyday && 'bg-red-50/80 hover:bg-red-100/80',
                !isHolyday && isSunday && 'bg-rose-50/40',
                !isHolyday && isSaturday && 'bg-blue-50/40'
            )}
        >
            {/* 날짜 */}
            <div
                className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-8 sm:w-8',
                    isHolyday && 'bg-red-100 text-red-700',
                    !isHolyday && isSunday && 'text-red-500 group-hover:bg-red-100',
                    !isHolyday && isSaturday && 'text-blue-500 group-hover:bg-blue-100',
                    !isHolyday && !isSunday && !isSaturday && 'group-hover:bg-muted'
                )}
            >
                {dayNumber}
            </div>

            {/* 출석 현황 */}
            {attendance.total > 0 && (
                <div className="mt-1 space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                getBarColor(isFullAttendance, hasAttendance)
                            )}
                            style={{ width: `${attendanceRate}%` }}
                        />
                    </div>
                    <div
                        className={cn('text-center text-xs font-medium', getTextColor(isFullAttendance, hasAttendance))}
                    >
                        {attendance.present}/{attendance.total}
                    </div>
                </div>
            )}

            {/* 의무축일 표시 */}
            {isHolyday && (
                <div className="absolute bottom-1 left-1 right-1 truncate rounded bg-red-100 px-1 py-0.5 text-center text-[10px] font-medium text-red-700 sm:bottom-2 sm:left-2 sm:right-2">
                    {holyday}
                </div>
            )}
        </button>
    );
}
