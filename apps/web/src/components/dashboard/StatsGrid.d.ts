import type { AttendanceRateOutput, AvgAttendanceOutput, GenderDistributionOutput, TopGroupsOutput, TopOverallOutput } from '@school/trpc';
interface StatsGridProps {
    weekly?: AttendanceRateOutput;
    monthly?: AttendanceRateOutput;
    yearly?: AttendanceRateOutput;
    avgAttendance?: AvgAttendanceOutput;
    byGender?: GenderDistributionOutput;
    topGroups?: TopGroupsOutput;
    topOverall?: TopOverallOutput;
    isLoading: boolean;
    error?: unknown;
}
export declare function StatsGrid({ weekly, monthly, yearly, avgAttendance, byGender, topGroups, topOverall, isLoading, error, }: StatsGridProps): import("react/jsx-runtime").JSX.Element;
export {};
