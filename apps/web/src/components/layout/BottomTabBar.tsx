import { BarChart3, CalendarCheck, GraduationCap, Home, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { cn } from '~/lib/utils';

type TabId = 'home' | 'attendance' | 'students' | 'statistics' | 'more';

interface TabDef {
    id: TabId;
    label: string;
    path: string;
    icon: typeof Home;
    requiresAuth: boolean;
}

const TABS: ReadonlyArray<TabDef> = [
    { id: 'home', label: '홈', path: '/', icon: Home, requiresAuth: false },
    { id: 'attendance', label: '출석', path: '/attendance', icon: CalendarCheck, requiresAuth: true },
    { id: 'students', label: '학생', path: '/students', icon: GraduationCap, requiresAuth: true },
    { id: 'statistics', label: '통계', path: '/statistics', icon: BarChart3, requiresAuth: true },
];

export const isActiveTab = (pathname: string, tabId: TabId): boolean => {
    if (tabId === 'home') return pathname === '/';
    if (tabId === 'attendance') return pathname.startsWith('/attendance');
    if (tabId === 'students') return pathname.startsWith('/students');
    if (tabId === 'statistics') return pathname.startsWith('/statistics');
    return false;
};

export const isMoreActive = (pathname: string): boolean => {
    if (pathname === '/') return false;
    if (pathname.startsWith('/attendance')) return false;
    if (pathname.startsWith('/students')) return false;
    if (pathname.startsWith('/statistics')) return false;
    return true;
};

export const resolveTabNavigation = (requiresAuth: boolean, isAuthenticated: boolean, targetPath: string): string =>
    requiresAuth && !isAuthenticated ? '/login' : targetPath;

interface BottomTabBarProps {
    onMoreClick: () => void;
    isMoreOpen: boolean;
}

const TAB_BUTTON_CLASS =
    'relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const ACTIVE_INDICATOR_CLASS = 'absolute inset-x-2 top-0 h-[2px] rounded-full bg-primary';

export function BottomTabBar({ onMoreClick, isMoreOpen }: BottomTabBarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleTabClick = (tab: TabDef) => {
        analytics.trackNavTabClicked(tab.id);
        navigate(resolveTabNavigation(tab.requiresAuth, isAuthenticated, tab.path));
    };

    const handleMoreClick = () => {
        analytics.trackNavTabClicked('more');
        onMoreClick();
    };

    const moreActive = isMoreOpen || isMoreActive(location.pathname);

    return (
        <nav
            aria-label="주요 내비게이션"
            className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = !isMoreOpen && isActiveTab(location.pathname, tab.id);
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(TAB_BUTTON_CLASS, active ? 'text-primary' : 'text-muted-foreground')}
                    >
                        {active ? <span className={ACTIVE_INDICATOR_CLASS} aria-hidden="true" /> : null}
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span className="truncate px-1">{tab.label}</span>
                    </button>
                );
            })}
            <button
                type="button"
                onClick={handleMoreClick}
                aria-current={moreActive ? 'page' : undefined}
                aria-expanded={isMoreOpen}
                className={cn(TAB_BUTTON_CLASS, moreActive ? 'text-primary' : 'text-muted-foreground')}
            >
                {moreActive ? <span className={ACTIVE_INDICATOR_CLASS} aria-hidden="true" /> : null}
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="truncate px-1">더보기</span>
            </button>
        </nav>
    );
}
