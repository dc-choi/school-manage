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
            <div className="hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:gap-8 lg:p-12">
                <div className="max-w-md space-y-4 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">
                        가톨릭 교회 모임 운영,
                        <br />더 쉽게
                    </h1>
                    <p className="text-lg text-muted-foreground">출석, 멤버, 통계를 한곳에서 관리하세요</p>
                </div>

                <img
                    src={screenshotSrc}
                    alt="출석부 대시보드 화면"
                    className="max-w-[480px] rounded-xl border shadow-2xl"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />

                {countData && countData.count > 0 && (
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <span>{countData.count}개 단체가 가입했습니다</span>
                    </div>
                )}
            </div>

            {/* 카드 섹션 */}
            <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2">
                {/* 모바일 히어로 (compact) */}
                <div className="mb-6 space-y-2 text-center lg:hidden">
                    <h1 className="text-2xl font-bold tracking-tight">가톨릭 교회 모임 운영, 더 쉽게</h1>
                    {countData && countData.count > 0 && (
                        <div className="flex items-center justify-center gap-2 text-base text-muted-foreground">
                            <Users className="h-5 w-5" />
                            <span>{countData.count}개 단체가 가입했습니다</span>
                        </div>
                    )}
                </div>

                <div className="animate-card-in w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
