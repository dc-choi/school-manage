import { Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { trpc } from '~/lib/trpc';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    const { data: countData } = trpc.account.count.useQuery(undefined, {
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const screenshotSrc = '/images/screenshot-dashboard.png';

    return (
        <div className="flex min-h-screen">
            {/* 히어로 섹션 (데스크톱만) */}
            <div className="hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:gap-12 lg:p-16">
                <div className="max-w-lg space-y-6 text-center">
                    <h1 className="text-5xl font-bold leading-snug tracking-tight xl:text-6xl">
                        종이 출석부, 엑셀 정리
                        <br />폰 하나로 바꿔보세요
                    </h1>
                    <p className="text-xl text-muted-foreground xl:text-2xl">
                        출석 체크부터 통계까지, 한곳에서 다 돼요.
                    </p>
                </div>

                <img
                    src={screenshotSrc}
                    alt="출석부 대시보드 화면"
                    className="max-w-[540px] rounded-xl border shadow-2xl"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />

                {countData && countData.count > 0 && (
                    <div className="flex items-center gap-3 text-lg text-muted-foreground xl:text-xl">
                        <Users className="h-6 w-6" />
                        <span>{countData.count}개 단체가 이미 폰으로 출석 관리 중이에요</span>
                    </div>
                )}
            </div>

            {/* 카드 섹션 */}
            <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2">
                {/* 모바일 히어로 (compact) */}
                <div className="mb-6 space-y-2 text-center lg:hidden">
                    <h1 className="text-2xl font-bold tracking-tight">종이 출석부, 엑셀 정리 — 폰 하나로 바꿔보세요</h1>
                    {countData && countData.count > 0 && (
                        <div className="flex items-center justify-center gap-2 text-base text-muted-foreground">
                            <Users className="h-5 w-5" />
                            <span>{countData.count}개 단체가 이미 폰으로 출석 관리 중이에요</span>
                        </div>
                    )}
                </div>

                <div className="animate-card-in w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
