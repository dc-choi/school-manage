import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const isActive = (path) => {
        if (path === '/')
            return location.pathname === '/';
        return location.pathname.startsWith(path);
    };
    return (_jsxs("aside", { className: "flex w-20 flex-col border-r bg-muted/20 sm:w-80", children: [_jsx("div", { className: "flex h-20 items-center justify-center border-b", children: _jsxs(Link, { to: "/", className: "text-lg font-bold tracking-tight transition-colors hover:text-primary sm:text-xl", children: [_jsx("span", { className: "sm:hidden", children: "\uC8FC\uC77C" }), _jsx("span", { className: "hidden sm:inline", children: "\uC8FC\uC77C\uD559\uAD50 \uAD00\uB9AC \uD504\uB85C\uADF8\uB7A8" })] }) }), _jsxs("nav", { className: "flex-1 space-y-2 px-2 py-6 sm:px-4", children: [_jsx("div", { className: "mb-6 hidden px-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:block", children: "\uBA54\uB274" }), navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (_jsxs(Link, { to: item.path, "aria-label": item.label, className: cn('flex items-center justify-center gap-0 rounded-xl px-0 py-4 text-base font-medium transition-all sm:justify-start sm:gap-5 sm:px-6 sm:py-5 sm:text-lg', active
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'), children: [_jsx(Icon, { className: "h-6 w-6 sm:h-7 sm:w-7" }), _jsx("span", { className: "hidden sm:inline", children: item.label })] }, item.path));
                    })] }), _jsx("div", { className: "hidden border-t p-6 sm:block", children: _jsx("p", { className: "text-center text-sm text-muted-foreground", children: "\u00A9 2022 \uC8FC\uC77C\uD559\uAD50 \uAD00\uB9AC \uD504\uB85C\uADF8\uB7A8" }) })] }));
}
