import { useAuth } from './hooks/useAuth';
import { CURRENT_PRIVACY_VERSION } from '@school/shared';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';

interface ProtectedRouteProps {
    children: ReactNode;
    requireOrganization?: boolean;
}

export function ProtectedRoute({ children, requireOrganization = true }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, privacyAgreedAt, privacyPolicyVersion, organizationId } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 미동의 또는 구버전 동의 → 재동의 페이지로
    if (!privacyAgreedAt || privacyPolicyVersion < CURRENT_PRIVACY_VERSION) {
        return <Navigate to="/consent" replace />;
    }

    // organizationId 체크 (requireOrganization=true인 라우트에서만)
    if (requireOrganization && !organizationId) {
        return <Navigate to="/join" replace />;
    }

    return <>{children}</>;
}
