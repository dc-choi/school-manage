interface CalendarHeaderProps {
    year: number;
    month: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}
export declare function CalendarHeader({ year, month, onPrevMonth, onNextMonth }: CalendarHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
