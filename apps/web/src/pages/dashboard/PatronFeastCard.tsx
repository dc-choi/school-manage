import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Card } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export function PatronFeastCard() {
    const currentMonth = new Date().getMonth() + 1;
    const { data, isLoading, isError } = trpc.student.feastDayList.useQuery(
        { month: currentMonth },
        { staleTime: 24 * 60 * 60 * 1000 }
    );
    const trackedRef = useRef(false);

    useEffect(() => {
        if (data && !trackedRef.current) {
            trackedRef.current = true;
            analytics.trackPatronFeastCardViewed();
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

    return (
        <Card className="p-4">
            <p className="font-semibold">이달의 축일자</p>
            {data && data.students.length > 0 ? (
                <ul className="mt-1 space-y-1">
                    {data.students.map((student) => {
                        const mmdd = student.baptizedAt.slice(5);
                        return (
                            <li
                                key={`${student.societyName}-${student.catholicName}-${student.baptizedAt}`}
                                className="text-sm"
                            >
                                {student.societyName} · {student.catholicName} · {mmdd}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="mt-1 text-sm text-muted-foreground">이달의 축일자가 없습니다</p>
            )}
        </Card>
    );
}
