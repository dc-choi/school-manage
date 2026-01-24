import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from '~/components/forms/LoginForm';
import { AuthLayout } from '~/components/layout';
import { useAuth } from '~/features/auth';

export function LoginPage() {
    const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (name: string, password: string) => {
        setError(null);
        setIsLoading(true);

        try {
            await login(name, password);
            navigate('/');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('로그인에 실패했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <LoginForm onSubmit={handleSubmit} error={error} isLoading={isLoading} />
        </AuthLayout>
    );
}
