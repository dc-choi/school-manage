import { useEffect, useRef } from 'react';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
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

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">이달의 축일자</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                    </div>
                ) : data && data.students.length > 0 ? (
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
                ) : (
                    <p className="text-sm text-muted-foreground">이달의 축일자가 없습니다</p>
                )}
            </CardContent>
        </Card>
    );
}
