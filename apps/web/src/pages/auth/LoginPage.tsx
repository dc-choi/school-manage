import { LoginForm } from './LoginForm';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/features/auth';
import { extractErrorMessage } from '~/lib/error';

export function LoginPage() {
    const { login, restoreAccount, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAccountDeleted, setIsAccountDeleted] = useState(false);
    const [credentials, setCredentials] = useState<{ name: string; password: string } | null>(null);

    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (name: string, password: string) => {
        setError(null);
        setIsAccountDeleted(false);
        setIsLoading(true);

        try {
            await login(name, password);
            navigate('/');
        } catch (err) {
            if (err instanceof Error && err.message.includes('ACCOUNT_DELETED')) {
                setIsAccountDeleted(true);
                setCredentials({ name, password });
            } else {
                setError(extractErrorMessage(err));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!credentials) return;

        setError(null);
        setIsLoading(true);

        try {
            await restoreAccount(credentials.name, credentials.password);
            navigate('/');
        } catch (err) {
            setError(extractErrorMessage(err));
            setIsAccountDeleted(false);
            setCredentials(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsAccountDeleted(false);
        setCredentials(null);
        setError(null);
    };

    if (isAccountDeleted) {
        return (
            <AuthLayout>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">계정 복원</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            이 계정은 삭제된 상태입니다.
                            <br />
                            복원하시겠습니까?
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isLoading}>
                                취소
                            </Button>
                            <Button className="flex-1" onClick={handleRestore} disabled={isLoading}>
                                {isLoading ? '복원 중...' : '복원'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <LoginForm onSubmit={handleSubmit} error={error} isLoading={isLoading} />
        </AuthLayout>
    );
}
