import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

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

function RankingContent({ items, isLoading, error }: Omit<TopRankingCardProps, 'title'>) {
    if (isLoading) {
        return (
            <div className="flex h-[150px] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }
    if (error) return <p className="text-sm text-destructive">데이터 로드 실패</p>;
    if (items.length > 0) {
        return (
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between">
                        <span className="truncate">
                            <span className="mr-2 font-medium text-muted-foreground">{index + 1}.</span>
                            {item.name}
                            {item.subText && (
                                <span className="ml-1 text-sm text-muted-foreground">({item.subText})</span>
                            )}
                        </span>
                        <span className="ml-2 whitespace-nowrap font-medium">
                            {item.value}
                            {item.valueSuffix}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return <p className="text-sm text-muted-foreground">데이터 없음</p>;
}

export function TopRankingCard({ title, items, isLoading, error }: TopRankingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <RankingContent items={items} isLoading={isLoading} error={error} />
            </CardContent>
        </Card>
    );
}
