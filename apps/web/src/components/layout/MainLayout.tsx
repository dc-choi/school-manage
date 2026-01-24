import { Sidebar } from './Sidebar';
import { LogOut, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/features/auth';

export interface MainLayoutProps {
    children: ReactNode;
    title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
    const { account, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-screen bg-muted/30">
            {/* 전체 컨테이너 - 둥근 모서리와 그림자 */}
            <div className="flex flex-1 overflow-hidden border bg-background">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between border-b px-12">
                        {/* 페이지 타이틀 */}
                        <div className="flex items-center gap-4">
                            {title && (
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    {title}
                                </h1>
                            )}
                        </div>

                        {/* 사용자 정보 & 로그아웃 */}
                        <div className="flex items-center gap-6 mr-12">
                            <div className="flex items-center gap-3 rounded-full bg-muted/50 py-2 pl-3 pr-5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-base font-medium">{account?.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="hidden sm:inline">로그아웃</span>
                            </Button>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-auto p-6">
                        <div className="w-full">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
