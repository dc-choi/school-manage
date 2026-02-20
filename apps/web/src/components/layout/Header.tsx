import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { useAuth } from '~/features/auth';

const navItems = [
    { path: '/', label: '대시보드' },
    { path: '/groups', label: '학년 관리' },
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

    const handleNavClick = (path: string) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">
                {/* Mobile menu button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="sm" className="mr-2 px-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="4" x2="20" y1="12" y2="12" />
                                <line x1="4" x2="20" y1="6" y2="6" />
                                <line x1="4" x2="20" y1="18" y2="18" />
                            </svg>
                            <span className="sr-only">메뉴</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64">
                        <SheetHeader>
                            <SheetTitle>출석부</SheetTitle>
                        </SheetHeader>
                        <nav className="mt-6 flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleNavClick(item.path)}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            <Separator className="my-2" />
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => handleNavClick('/settings')}
                            >
                                {account?.name}
                            </Button>
                            <Button variant="outline" onClick={handleLogout}>
                                로그아웃
                            </Button>
                        </nav>
                    </SheetContent>
                </Sheet>

                {/* Logo */}
                <Link to="/" className="text-lg font-bold">
                    출석부
                </Link>

                {/* Desktop navigation */}
                <Separator orientation="vertical" className="mx-6 hidden h-6 md:block" />
                <nav className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                            size="sm"
                            asChild
                        >
                            <Link to={item.path}>{item.label}</Link>
                        </Button>
                    ))}
                </nav>

                {/* Desktop user menu */}
                <div className="ml-auto hidden items-center gap-4 md:flex">
                    <Link
                        to="/settings"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {account?.name}
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        로그아웃
                    </Button>
                </div>

                {/* Mobile user name */}
                <Link
                    to="/settings"
                    className="ml-auto text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                >
                    {account?.name}
                </Link>
            </div>
        </header>
    );
}
