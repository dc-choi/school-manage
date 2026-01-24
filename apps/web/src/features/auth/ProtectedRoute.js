import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from './hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
export function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return _jsx(LoadingSpinner, {});
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
