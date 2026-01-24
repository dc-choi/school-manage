import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { useAuth } from '~/features/auth';
const navItems = [
    { path: '/', label: '대시보드' },
    { path: '/groups', label: '그룹 관리' },
    { path: '/students', label: '학생 관리' },
    { path: '/attendance', label: '출석부' },
];
export function Header() {
    const { account, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const handleNavClick = (path) => {
        setMobileMenuOpen(false);
        navigate(path);
    };
    return (_jsx("header", { className: "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60", children: _jsxs("div", { className: "flex h-14 items-center px-4 sm:px-6 lg:px-8", children: [_jsxs(Sheet, { open: mobileMenuOpen, onOpenChange: setMobileMenuOpen, children: [_jsx(SheetTrigger, { asChild: true, className: "md:hidden", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "mr-2 px-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), _jsx("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), _jsx("line", { x1: "4", x2: "20", y1: "18", y2: "18" })] }), _jsx("span", { className: "sr-only", children: "\uBA54\uB274" })] }) }), _jsxs(SheetContent, { side: "left", className: "w-64", children: [_jsx(SheetHeader, { children: _jsx(SheetTitle, { children: "\uCD9C\uC11D\uBD80" }) }), _jsxs("nav", { className: "mt-6 flex flex-col gap-2", children: [navItems.map((item) => (_jsx(Button, { variant: location.pathname === item.path ? 'secondary' : 'ghost', className: "justify-start", onClick: () => handleNavClick(item.path), children: item.label }, item.path))), _jsx(Separator, { className: "my-2" }), _jsx("div", { className: "px-4 py-2 text-sm text-muted-foreground", children: account?.name }), _jsx(Button, { variant: "outline", onClick: handleLogout, children: "\uB85C\uADF8\uC544\uC6C3" })] })] })] }), _jsx(Link, { to: "/", className: "text-lg font-bold", children: "\uCD9C\uC11D\uBD80" }), _jsx(Separator, { orientation: "vertical", className: "mx-6 hidden h-6 md:block" }), _jsx("nav", { className: "hidden items-center gap-1 md:flex", children: navItems.map((item) => (_jsx(Button, { variant: location.pathname === item.path ? 'secondary' : 'ghost', size: "sm", asChild: true, children: _jsx(Link, { to: item.path, children: item.label }) }, item.path))) }), _jsxs("div", { className: "ml-auto hidden items-center gap-4 md:flex", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: account?.name }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleLogout, children: "\uB85C\uADF8\uC544\uC6C3" })] }), _jsx("span", { className: "ml-auto text-sm text-muted-foreground md:hidden", children: account?.name })] }) }));
}
