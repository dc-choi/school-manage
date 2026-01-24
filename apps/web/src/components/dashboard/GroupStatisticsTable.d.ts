import type { GroupStatisticsOutput } from '@school/trpc';
interface GroupStatisticsTableProps {
    data?: GroupStatisticsOutput;
    isLoading: boolean;
    error?: boolean;
}
export declare function GroupStatisticsTable({ data, isLoading, error }: GroupStatisticsTableProps): import("react/jsx-runtime").JSX.Element;
export {};
