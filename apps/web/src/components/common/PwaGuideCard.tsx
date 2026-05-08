import { ExternalLink, Share, Smartphone, X } from 'lucide-react';
import { useCallback, useId } from 'react';
import { Button } from '~/components/ui/button';
import { analytics } from '~/lib/analytics';
import { type PwaEnv, consumeInstallPrompt, getInstallPrompt } from '~/lib/pwa';

interface PwaGuideCardProps {
    env: PwaEnv;
    onDismiss: (persistent: boolean) => void;
}

interface CardContent {
    icon: React.ReactNode;
    header: string;
    body: string;
    cta: string | null;
}

const ICON_BASE = 'h-5 w-5';

const cardContentByEnv: Record<PwaEnv, CardContent | null> = {
    'android-chrome': {
        icon: <Smartphone className={ICON_BASE} aria-hidden="true" />,
        header: '앱처럼 사용하기',
        body: '홈 화면에 추가하면 매번 인터넷 켜지 않고 한 번에 열 수 있어요.',
        cta: '지금 설치',
    },
    'samsung': {
        icon: <Smartphone className={ICON_BASE} aria-hidden="true" />,
        header: '앱처럼 사용하기',
        body: '홈 화면에 추가하면 매번 인터넷 켜지 않고 한 번에 열 수 있어요.',
        cta: '지금 설치',
    },
    'ios-safari': {
        icon: <Share className={ICON_BASE} aria-hidden="true" />,
        header: '홈 화면에 추가하기',
        body: '하단 [공유] 버튼을 누른 뒤 [홈 화면에 추가]를 선택하세요. 매번 인터넷 안 켜도 돼요.',
        cta: null,
    },
    'ios-chrome': {
        icon: <ExternalLink className={ICON_BASE} aria-hidden="true" />,
        header: '사파리에서 열어주세요',
        body: '아이폰에서는 사파리에서만 앱처럼 풀스크린으로 사용할 수 있어요.',
        cta: '사파리에서 열기',
    },
    'kakao': {
        icon: <ExternalLink className={ICON_BASE} aria-hidden="true" />,
        header: '더 편하게 쓰려면',
        body: '카카오톡 안에서는 앱처럼 설치할 수 없어요. 우상단 메뉴 [⋯] → [다른 브라우저로 열기]를 눌러주세요.',
        cta: '외부 브라우저로 열기',
    },
    'instagram': {
        icon: <ExternalLink className={ICON_BASE} aria-hidden="true" />,
        header: '더 편하게 쓰려면',
        body: '우상단 메뉴 [⋯] → [브라우저에서 열기]를 누르면 더 편하게 쓸 수 있어요.',
        cta: '외부 브라우저로 열기',
    },
    'facebook': {
        icon: <ExternalLink className={ICON_BASE} aria-hidden="true" />,
        header: '더 편하게 쓰려면',
        body: '우상단 메뉴 [⋯] → [브라우저에서 열기]를 누르면 더 편하게 쓸 수 있어요.',
        cta: '외부 브라우저로 열기',
    },
    'other-mobile': null,
    'desktop': null,
};

export function PwaGuideCard({ env, onDismiss }: PwaGuideCardProps) {
    const titleId = useId();

    const handleAndroidInstall = useCallback(async (): Promise<void> => {
        const promptEvent = consumeInstallPrompt();
        if (!promptEvent) {
            // race: 사용자 더블탭 또는 다른 탭의 appinstalled로 prompt 무효화
            onDismiss(false);
            return;
        }
        try {
            await promptEvent.prompt();
            await promptEvent.userChoice;
        } catch (error: unknown) {
            console.warn('[PWA] 설치 프롬프트 실패', error);
        }
    }, [onDismiss]);

    const handleExternalBrowser = useCallback((): void => {
        analytics.trackPwaExternalBrowserClicked(env);
        if (typeof window !== 'undefined') {
            window.open(window.location.href, '_blank');
        }
    }, [env]);

    const handleCta = useCallback(async (): Promise<void> => {
        if (env === 'android-chrome' || env === 'samsung') {
            await handleAndroidInstall();
            onDismiss(false);
            return;
        }
        if (env === 'ios-safari') {
            return;
        }
        handleExternalBrowser();
        onDismiss(false);
    }, [env, handleAndroidInstall, handleExternalBrowser, onDismiss]);

    const content = cardContentByEnv[env];
    if (!content) return null;

    const isAndroid = env === 'android-chrome' || env === 'samsung';
    const ctaDisabled = isAndroid && !getInstallPrompt();

    // 위치: BottomTabBar 위에 토스트형 sticky.
    // BottomTabBar가 자체적으로 pb-[env(safe-area-inset-bottom)]로 안전영역을 흡수하므로,
    // 카드 외부 box bottom 거리에 한 번 더 더해 카드 하단 = 탭바 상단으로 정합한다.
    return (
        <aside
            className="pointer-events-auto fixed inset-x-3 z-40 mx-auto w-auto max-w-md animate-card-in rounded-2xl border bg-background p-4 shadow-lg md:hidden"
            style={{
                bottom: 'calc(var(--bottom-tab-bar-height) + env(safe-area-inset-bottom) + 0.5rem)',
            }}
            aria-labelledby={titleId}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {content.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 id={titleId} className="text-balance text-sm font-semibold text-foreground">
                        {content.header}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{content.body}</p>
                    {ctaDisabled ? (
                        <p className="mt-2 text-xs text-muted-foreground">잠시 뒤 다시 시도해 주세요.</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {content.cta ? (
                            <Button
                                size="sm"
                                onClick={() => {
                                    handleCta().catch((error: unknown) => {
                                        console.warn('[PWA] CTA 처리 실패', error);
                                    });
                                }}
                                disabled={ctaDisabled}
                            >
                                {content.cta}
                            </Button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => onDismiss(true)}
                            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            다시 보지 않기
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onDismiss(false)}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="닫기"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </aside>
    );
}
