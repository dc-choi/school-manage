import { Calendar, Home, UserCog, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '~/lib/utils';

export const navItems = [
    { path: '/', label: '대시보드', icon: Home },
    { path: '/attendance', label: '출석부', icon: Calendar },
    { path: '/groups', label: '학년 관리', icon: Users },
    { path: '/students', label: '학생 관리', icon: UserCog },
];

export function Sidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="hidden flex-col border-r bg-muted/20 md:flex md:w-20 lg:w-80">
            {/* Logo */}
            <div className="flex h-20 items-center justify-center border-b">
                <Link
                    to="/"
                    className="text-lg font-bold tracking-tight transition-colors hover:text-primary lg:text-xl"
                >
                    <span className="lg:hidden">주일</span>
                    <span className="hidden lg:inline">주일학교 출석부</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-2 py-6 lg:px-4">
                <div className="mb-6 hidden px-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground lg:block">
                    메뉴
                </div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            aria-label={item.label}
                            className={cn(
                                'flex items-center justify-center gap-0 rounded-xl px-0 py-4 text-base font-medium transition-all lg:justify-start lg:gap-5 lg:px-6 lg:py-5 lg:text-lg',
                                active
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon className="h-6 w-6 lg:h-7 lg:w-7" />
                            <span className="hidden lg:inline">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="hidden border-t p-6 lg:block">
                <p className="text-center text-sm text-muted-foreground">
                    © 2022–{new Date().getFullYear()} 주일학교 출석부
                </p>
            </div>
        </aside>
    );
}
