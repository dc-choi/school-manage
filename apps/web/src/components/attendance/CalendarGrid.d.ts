import type { CalendarDay } from '@school/trpc';
interface CalendarGridProps {
    year: number;
    month: number;
    days: CalendarDay[];
    onDateClick: (date: string) => void;
}
export declare function CalendarGrid({ year, month, days, onDateClick }: CalendarGridProps): import("react/jsx-runtime").JSX.Element;
export {};
