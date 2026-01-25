import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

interface StatCardProps {
    title: string;
    value?: number;
    suffix?: string;
    description?: string;
    isLoading: boolean;
    error?: boolean;
}

export function StatCard({ title, value, suffix = '', description, isLoading, error }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <p className="text-sm text-destructive">데이터 로드 실패</p>
                ) : (
                    <>
                        <p className="text-2xl font-bold">{value !== undefined ? `${value}${suffix}` : '-'}</p>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
