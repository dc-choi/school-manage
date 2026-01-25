import { Calendar, Home, UserCog, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '~/lib/utils';

const navItems = [
    { path: '/', label: '대시보드', icon: Home },
    { path: '/attendance', label: '출석부', icon: Calendar },
    { path: '/groups', label: '그룹 관리', icon: Users },
    { path: '/students', label: '학생 관리', icon: UserCog },
];

export function Sidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="flex w-20 flex-col border-r bg-muted/20 sm:w-80">
            {/* Logo */}
            <div className="flex h-20 items-center justify-center border-b">
                <Link
                    to="/"
                    className="text-lg font-bold tracking-tight transition-colors hover:text-primary sm:text-xl"
                >
                    <span className="sm:hidden">주일</span>
                    <span className="hidden sm:inline">주일학교 관리 프로그램</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-2 py-6 sm:px-4">
                <div className="mb-6 hidden px-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:block">
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
                                'flex items-center justify-center gap-0 rounded-xl px-0 py-4 text-base font-medium transition-all sm:justify-start sm:gap-5 sm:px-6 sm:py-5 sm:text-lg',
                                active
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                            <span className="hidden sm:inline">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="hidden border-t p-6 sm:block">
                <p className="text-center text-sm text-muted-foreground">© 2022 주일학교 관리 프로그램</p>
            </div>
        </aside>
    );
}
