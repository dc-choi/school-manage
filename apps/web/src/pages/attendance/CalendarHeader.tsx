import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface CalendarHeaderProps {
    year: number;
    month: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export function CalendarHeader({ year, month, onPrevMonth, onNextMonth }: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-center gap-6">
            <Button
                variant="outline"
                size="icon"
                onClick={onPrevMonth}
                aria-label="이전 월"
                className="h-10 w-10 rounded-full"
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">
                    {year}년 {month}월
                </h2>
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={onNextMonth}
                aria-label="다음 월"
                className="h-10 w-10 rounded-full"
            >
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    );
}
