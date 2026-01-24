import type { CalendarDay } from '@school/trpc';
interface CalendarCellProps {
    day: CalendarDay | null;
    onClick?: (date: string) => void;
}
export declare function CalendarCell({ day, onClick }: CalendarCellProps): import("react/jsx-runtime").JSX.Element;
export {};
