import type { GenderDistributionOutput } from '@school/trpc';
interface GenderDistributionChartProps {
    data?: GenderDistributionOutput;
    isLoading: boolean;
    error?: boolean;
}
export declare function GenderDistributionChart({ data, isLoading, error }: GenderDistributionChartProps): import("react/jsx-runtime").JSX.Element;
export {};
