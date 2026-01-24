import type { AttendanceRateOutput } from '@school/trpc';
interface AttendanceRateChartProps {
    weekly?: AttendanceRateOutput;
    monthly?: AttendanceRateOutput;
    yearly?: AttendanceRateOutput;
    isLoading: boolean;
    error?: boolean;
}
export declare function AttendanceRateChart({ weekly, monthly, yearly, isLoading, error }: AttendanceRateChartProps): import("react/jsx-runtime").JSX.Element;
export {};
