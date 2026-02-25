import { Sidebar, navItems } from './Sidebar';
import { LogOut, Menu, User } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { useAuth } from '~/features/auth';
import { cn } from '~/lib/utils';

export interface MainLayoutProps {
    children: ReactNode;
    title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <div className="flex h-screen w-screen bg-muted/30">
            {/* 전체 컨테이너 */}
            <div className="flex flex-1 overflow-hidden border bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between border-b px-4 md:px-8 lg:px-12">
                        {/* 모바일 햄버거 메뉴 + 페이지 타이틀 */}
                        <div className="flex items-center gap-3">
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72">
                                    <SheetHeader>
                                        <SheetTitle>주일학교 출석부</SheetTitle>
                                    </SheetHeader>
                                    <nav className="mt-6 flex flex-col gap-2">
                                        {navItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.path);
                                            return (
                                                <button
                                                    key={item.path}
                                                    type="button"
                                                    onClick={() => handleNavClick(item.path)}
                                                    className={cn(
                                                        'flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all',
                                                        active
                                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </SheetContent>
                            </Sheet>
                            {title && (
                                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
                                    {title}
                                </h1>
                            )}
                        </div>

                        {/* 사용자 정보 & 로그아웃 */}
                        <div className="flex items-center gap-3 md:gap-6">
                            <Link
                                to="/settings"
                                className="flex items-center gap-2 rounded-full bg-muted/50 py-1.5 pl-2 pr-3 transition-colors hover:bg-muted md:gap-3 md:py-2 md:pl-3 md:pr-5"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 md:h-9 md:w-9">
                                    <User className="h-4 w-4 text-primary md:h-5 md:w-5" />
                                </div>
                                <span className="hidden text-sm font-medium sm:inline md:text-base">
                                    {account?.displayName}
                                </span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="hidden md:inline">로그아웃</span>
                            </Button>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                        <div className="w-full">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
