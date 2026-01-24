import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sidebar } from './Sidebar';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/features/auth';
export function MainLayout({ children, title }) {
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsx("div", { className: "flex h-screen w-screen bg-muted/30", children: _jsxs("div", { className: "flex flex-1 overflow-hidden border bg-background", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden", children: [_jsxs("header", { className: "flex h-16 items-center justify-between border-b px-12", children: [_jsx("div", { className: "flex items-center gap-4", children: title && (_jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: title })) }), _jsxs("div", { className: "flex items-center gap-6 mr-12", children: [_jsxs("div", { className: "flex items-center gap-3 rounded-full bg-muted/50 py-2 pl-3 pr-5", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10", children: _jsx(User, { className: "h-5 w-5 text-primary" }) }), _jsx("span", { className: "text-base font-medium", children: account?.name })] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: handleLogout, className: "gap-2 text-muted-foreground hover:text-foreground", children: [_jsx(LogOut, { className: "h-5 w-5" }), _jsx("span", { className: "hidden sm:inline", children: "\uB85C\uADF8\uC544\uC6C3" })] })] })] }), _jsx("main", { className: "flex-1 overflow-auto p-10", children: _jsx("div", { className: "w-full", children: children }) })] })] }) }));
}
