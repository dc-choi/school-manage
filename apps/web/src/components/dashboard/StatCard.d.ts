interface StatCardProps {
    title: string;
    value?: number;
    suffix?: string;
    description?: string;
    isLoading: boolean;
    error?: boolean;
}
export declare function StatCard({ title, value, suffix, description, isLoading, error }: StatCardProps): import("react/jsx-runtime").JSX.Element;
export {};
