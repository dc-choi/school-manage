import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

function PatronFeastContent({
    data,
    isLoading,
}: {
    data?: { students: { societyName: string; catholicName: string; baptizedAt: string }[] };
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <LoadingSpinner />
            </div>
        );
    }
    if (data && data.students.length > 0) {
        return (
            <ul className="space-y-2">
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
        );
    }
    return <p className="text-sm text-muted-foreground">이달의 축일자가 없습니다</p>;
}

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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">이달의 축일자</CardTitle>
            </CardHeader>
            <CardContent>
                <PatronFeastContent data={data} isLoading={isLoading} />
            </CardContent>
        </Card>
    );
}
