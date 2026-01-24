import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from '~/components/forms/LoginForm';
import { AuthLayout } from '~/components/layout';
import { useAuth } from '~/features/auth';
export function LoginPage() {
    const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (isAuthenticated && !isAuthLoading) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const handleSubmit = async (name, password) => {
        setError(null);
        setIsLoading(true);
        try {
            await login(name, password);
            navigate('/');
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('로그인에 실패했습니다.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx(AuthLayout, { children: _jsx(LoginForm, { onSubmit: handleSubmit, error: error, isLoading: isLoading }) }));
}
