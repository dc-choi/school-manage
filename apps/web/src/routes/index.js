import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '~/features/auth';
import { AttendancePage, CalendarPage, DashboardPage, GroupAddPage, GroupDetailPage, GroupListPage, LoginPage, StudentAddPage, StudentDetailPage, StudentListPage, } from '~/pages';
const routes = [
    // Public routes
    {
        path: '/login',
        element: _jsx(LoginPage, {}),
    },
    // Protected routes
    {
        path: '/',
        element: (_jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) })),
    },
    {
        path: '/groups',
        element: (_jsx(ProtectedRoute, { children: _jsx(GroupListPage, {}) })),
    },
    {
        path: '/groups/new',
        element: (_jsx(ProtectedRoute, { children: _jsx(GroupAddPage, {}) })),
    },
    {
        path: '/groups/:id',
        element: (_jsx(ProtectedRoute, { children: _jsx(GroupDetailPage, {}) })),
    },
    {
        // /groups/:id/edit -> /groups/:id 리다이렉트 (인라인 수정으로 통합)
        path: '/groups/:id/edit',
        element: _jsx(Navigate, { to: "..", replace: true }),
    },
    {
        path: '/students',
        element: (_jsx(ProtectedRoute, { children: _jsx(StudentListPage, {}) })),
    },
    {
        path: '/students/new',
        element: (_jsx(ProtectedRoute, { children: _jsx(StudentAddPage, {}) })),
    },
    {
        path: '/students/:id',
        element: (_jsx(ProtectedRoute, { children: _jsx(StudentDetailPage, {}) })),
    },
    {
        // /students/:id/edit -> /students/:id 리다이렉트 (인라인 수정으로 통합)
        path: '/students/:id/edit',
        element: _jsx(Navigate, { to: "..", replace: true }),
    },
    {
        path: '/attendance',
        element: (_jsx(ProtectedRoute, { children: _jsx(CalendarPage, {}) })),
    },
    {
        path: '/attendance/table',
        element: (_jsx(ProtectedRoute, { children: _jsx(AttendancePage, {}) })),
    },
];
export const router = createBrowserRouter(routes);
