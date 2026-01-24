import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">{children}</div>;
}
