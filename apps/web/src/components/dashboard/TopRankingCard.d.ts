interface RankingItem {
    id: string;
    name: string;
    subText?: string;
    value: number;
    valueSuffix: string;
}
interface TopRankingCardProps {
    title: string;
    items: RankingItem[];
    isLoading: boolean;
    error?: boolean;
}
export declare function TopRankingCard({ title, items, isLoading, error }: TopRankingCardProps): import("react/jsx-runtime").JSX.Element;
export {};
