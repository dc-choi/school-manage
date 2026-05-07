import { BottomTabBar } from './BottomTabBar';
import { Sidebar } from './Sidebar';
import { Heart, LogIn, LogOut, Settings, User, UserPlus, Users } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { useAuth } from '~/features/auth';
import { useLiturgicalTheme } from '~/hooks/useLiturgicalTheme';
import { analytics } from '~/lib/analytics';
import { hasDonationLink } from '~/lib/donation';

export interface MainLayoutProps {
    children: ReactNode;
    title?: string;
}

const MORE_ITEM_CLASS =
    'flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function MainLayout({ children, title }: MainLayoutProps) {
    const { isAuthenticated, account, logout } = useAuth();
    const navigate = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);
    useLiturgicalTheme();

    const handleMoreOpenChange = (open: boolean) => {
        setMoreOpen(open);
        if (open) analytics.trackMoreSheetOpened();
    };

    const handleLogout = () => {
        logout();
        setMoreOpen(false);
    };

    const handleMoreNav = (path: string) => {
        setMoreOpen(false);
        const target = !isAuthenticated && path !== '/donate' ? '/login' : path;
        navigate(target);
    };

    return (
        <div className="flex h-screen w-screen bg-muted/30">
            <div className="flex flex-1 overflow-hidden border bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-14 items-center justify-between border-b px-4 md:h-16 md:px-8 lg:px-12">
                        {title ? (
                            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
                                {title}
                            </h1>
                        ) : (
                            <span className="sr-only">주일학교 출석부</span>
                        )}

                        <div className="flex items-center gap-3 md:gap-6">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-2 rounded-full bg-muted/50 py-1.5 pl-2 pr-3 transition-colors hover:bg-muted md:gap-3 md:py-2 md:pl-3 md:pr-5"
                                    >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 md:h-9 md:w-9">
                                            <User className="h-4 w-4 text-primary md:h-5 md:w-5" />
                                        </div>
                                        <div className="hidden flex-col items-end sm:flex">
                                            <span className="text-sm font-medium md:text-base">
                                                {account?.displayName}
                                            </span>
                                        </div>
                                    </Link>
                                    {/* 로그아웃 — 데스크탑(≥md)만. 모바일은 더보기 시트에 노출 */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="hidden gap-2 text-muted-foreground hover:text-foreground md:inline-flex"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>로그아웃</span>
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/login')}
                                    className="gap-2 text-muted-foreground hover:text-foreground"
                                    aria-label="로그인/회원가입"
                                >
                                    <LogIn className="h-5 w-5" />
                                    <span className="hidden md:inline">로그인/회원가입</span>
                                </Button>
                            )}
                        </div>
                    </header>

                    {/* Content — 모바일은 하단 탭바 가림 방지 pb-20 + safe-area, 데스크탑은 기존 padding */}
                    <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6 [@supports(padding:env(safe-area-inset-bottom))]:pb-[calc(5rem+env(safe-area-inset-bottom))] md:[@supports(padding:env(safe-area-inset-bottom))]:pb-6">
                        <div className="w-full">{children}</div>
                    </main>
                </div>
            </div>

            {/* 모바일 하단 탭바 (md:hidden 내부 처리) */}
            <BottomTabBar onMoreClick={() => setMoreOpen(true)} isMoreOpen={moreOpen} />

            {/* 모바일 더보기 시트 — 보조 메뉴 (인증 시 학년/설정/후원/로그아웃, 게스트 시 학년/로그인/회원가입/후원) */}
            <Sheet open={moreOpen} onOpenChange={handleMoreOpenChange}>
                <SheetContent side="right" className="w-72">
                    <SheetHeader>
                        <SheetTitle>주일학교 출석부</SheetTitle>
                    </SheetHeader>
                    <nav className="mt-6 flex flex-col gap-2">
                        <button type="button" onClick={() => handleMoreNav('/groups')} className={MORE_ITEM_CLASS}>
                            <Users className="h-5 w-5" aria-hidden="true" />
                            학년
                        </button>
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => handleMoreNav('/settings')}
                                className={MORE_ITEM_CLASS}
                            >
                                <Settings className="h-5 w-5" aria-hidden="true" />
                                설정
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleMoreNav('/login')}
                                    className={MORE_ITEM_CLASS}
                                >
                                    <LogIn className="h-5 w-5" aria-hidden="true" />
                                    로그인
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMoreNav('/signup')}
                                    className={MORE_ITEM_CLASS}
                                >
                                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                                    회원가입
                                </button>
                            </>
                        )}
                    </nav>
                    {hasDonationLink ? (
                        <div className="mt-6 border-t pt-4">
                            <button type="button" onClick={() => handleMoreNav('/donate')} className={MORE_ITEM_CLASS}>
                                <Heart className="h-5 w-5" aria-hidden="true" />
                                후원하기
                            </button>
                        </div>
                    ) : null}
                    {isAuthenticated ? (
                        <div className="mt-2">
                            <button type="button" onClick={handleLogout} className={MORE_ITEM_CLASS}>
                                <LogOut className="h-5 w-5" aria-hidden="true" />
                                로그아웃
                            </button>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}
