import { useAuth } from './hooks/useAuth';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';

interface ProtectedRouteProps {
    children: ReactNode;
    requireOrganization?: boolean;
}

export function ProtectedRoute({ children, requireOrganization = true }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, privacyAgreedAt, organizationId } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!privacyAgreedAt) {
        return <Navigate to="/consent" replace />;
    }

    // organizationId 체크 (requireOrganization=true인 라우트에서만)
    if (requireOrganization && !organizationId) {
        return <Navigate to="/join" replace />;
    }

    return <>{children}</>;
}
