import { formatDateShortKR } from '@school/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Card } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

const LITURGICAL_COLOR_MAP: Record<string, string> = {
    purple: 'bg-purple-500',
    white: 'bg-amber-300',
    green: 'bg-green-500',
    red: 'bg-red-500',
};

export function LiturgicalSeasonCard() {
    const currentYear = new Date().getFullYear();
    const { data, isLoading, isError } = trpc.liturgical.season.useQuery(
        { year: currentYear },
        { staleTime: 24 * 60 * 60 * 1000 }
    );
    const trackedRef = useRef(false);

    useEffect(() => {
        if (data && !trackedRef.current) {
            trackedRef.current = true;
            analytics.trackLiturgicalCardViewed();
        }
    }, [data]);

    if (isError) {
        return null;
    }

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="로딩 중" />
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const colorClass = LITURGICAL_COLOR_MAP[data.color] ?? 'bg-gray-400';

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${colorClass}`} aria-hidden="true" />
                <span className="font-semibold">{data.season}</span>
            </div>

            {data.upcomingHolydays.length > 0 ? (
                <div className="mt-3">
                    <p className="text-sm text-muted-foreground">다가오는 축일</p>
                    <ul className="mt-1 space-y-1">
                        {data.upcomingHolydays.map((h) => (
                            <li key={h.date + h.name} className="text-sm">
                                <span className="text-muted-foreground">{formatDateShortKR(h.date)}</span> {h.name}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </Card>
    );
}
