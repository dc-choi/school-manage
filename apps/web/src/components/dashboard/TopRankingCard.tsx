import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';

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

export function TopRankingCard({ title, items, isLoading, error }: TopRankingCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[150px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : items.length > 0 ? (
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
                ) : (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                )}
            </CardContent>
        </Card>
    );
}