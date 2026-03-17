import { addDays, formatDateISO } from '@school/utils';
import { CalendarCheck } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';

export function ContextBanner() {
    const navigate = useNavigate();
    const trackedRef = useRef(false);

    const { month, day, isToday, isoDate } = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const isSunday = dayOfWeek === 0;
        const nextSunday = isSunday ? now : addDays(now, 7 - dayOfWeek);

        return {
            month: nextSunday.getMonth() + 1,
            day: nextSunday.getDate(),
            isToday: isSunday,
            isoDate: formatDateISO(nextSunday),
        };
    }, []);

    useEffect(() => {
        if (!trackedRef.current) {
            trackedRef.current = true;
            analytics.trackContextBannerShown(isoDate);
        }
    }, [isoDate]);

    const message = isToday
        ? `오늘(${month}월 ${day}일)에 첫 출석을 기록해보세요`
        : `이번 주 일요일(${month}월 ${day}일)에 첫 출석을 기록해보세요`;

    return (
        <Card className="p-4 border-primary">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3">
                    <CalendarCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <p className="text-sm font-medium md:text-base" role="status">
                        {message}
                    </p>
                </div>
                <Button
                    className="w-full shrink-0 md:w-auto"
                    onClick={() => {
                        analytics.trackContextBannerClicked();
                        navigate('/attendance');
                    }}
                >
                    출석부 열기
                </Button>
            </div>
        </Card>
    );
}
