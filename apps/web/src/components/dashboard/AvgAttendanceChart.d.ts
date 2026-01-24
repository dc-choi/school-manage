import type { AttendanceRateOutput } from '@school/trpc';
interface AvgAttendanceChartProps {
    weekly?: AttendanceRateOutput;
    monthly?: AttendanceRateOutput;
    yearly?: AttendanceRateOutput;
    isLoading: boolean;
    error?: boolean;
}
export declare function AvgAttendanceChart({ weekly, monthly, yearly, isLoading, error }: AvgAttendanceChartProps): import("react/jsx-runtime").JSX.Element;
export {};
