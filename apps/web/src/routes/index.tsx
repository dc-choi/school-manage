import { Suspense, lazy } from 'react';
import { Navigate, Outlet, type RouteObject, createBrowserRouter } from 'react-router-dom';
import { LoadingFallback } from '~/components/common/LoadingFallback';
import { RouteErrorFallback } from '~/components/common/RouteErrorFallback';
import { ProtectedRoute } from '~/features/auth';
import { LandingPage, LoginPage, SignupPage } from '~/pages';

// Lazy pages — 인증 후 접근, 필요 시 로드
const ConsentPage = lazy(() => import('~/pages/auth/ConsentPage').then((m) => ({ default: m.ConsentPage })));
const DashboardPage = lazy(() => import('~/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ResetPasswordPage = lazy(() =>
    import('~/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const SettingsPage = lazy(() => import('~/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const GroupListPage = lazy(() => import('~/pages/group/GroupListPage').then((m) => ({ default: m.GroupListPage })));
const GroupDetailPage = lazy(() =>
    import('~/pages/group/GroupDetailPage').then((m) => ({ default: m.GroupDetailPage }))
);
const GroupAddPage = lazy(() => import('~/pages/group/GroupAddPage').then((m) => ({ default: m.GroupAddPage })));
const StudentListPage = lazy(() =>
    import('~/pages/student/StudentListPage').then((m) => ({ default: m.StudentListPage }))
);
const StudentDetailPage = lazy(() =>
    import('~/pages/student/StudentDetailPage').then((m) => ({
        default: m.StudentDetailPage,
    }))
);
const StudentAddPage = lazy(() =>
    import('~/pages/student/StudentAddPage').then((m) => ({ default: m.StudentAddPage }))
);
const AttendancePage = lazy(() =>
    import('~/pages/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage }))
);
const CalendarPage = lazy(() => import('~/pages/attendance/CalendarPage').then((m) => ({ default: m.CalendarPage })));

const routes: RouteObject[] = [
    {
        errorElement: <RouteErrorFallback />,
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <Outlet />
            </Suspense>
        ),
        children: [
            // Public routes (eager)
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                path: '/signup',
                element: <SignupPage />,
            },
            {
                path: '/landing',
                element: <LandingPage />,
            },
            // Public routes (lazy)
            {
                path: '/consent',
                element: <ConsentPage />,
            },
            {
                path: '/reset-password',
                element: <ResetPasswordPage />,
            },
            // Protected routes (lazy)
            {
                path: '/',
                element: (
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/groups',
                element: (
                    <ProtectedRoute>
                        <GroupListPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/groups/new',
                element: (
                    <ProtectedRoute>
                        <GroupAddPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/groups/:id',
                element: (
                    <ProtectedRoute>
                        <GroupDetailPage />
                    </ProtectedRoute>
                ),
            },
            {
                // /groups/:id/edit -> /groups/:id 리다이렉트 (인라인 수정으로 통합)
                path: '/groups/:id/edit',
                element: <Navigate to=".." replace />,
            },
            {
                path: '/students',
                element: (
                    <ProtectedRoute>
                        <StudentListPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/students/new',
                element: (
                    <ProtectedRoute>
                        <StudentAddPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/students/:id',
                element: (
                    <ProtectedRoute>
                        <StudentDetailPage />
                    </ProtectedRoute>
                ),
            },
            {
                // /students/:id/edit -> /students/:id 리다이렉트 (인라인 수정으로 통합)
                path: '/students/:id/edit',
                element: <Navigate to=".." replace />,
            },
            {
                path: '/attendance',
                element: (
                    <ProtectedRoute>
                        <CalendarPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/attendance/table',
                element: (
                    <ProtectedRoute>
                        <AttendancePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/settings',
                element: (
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },
];

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routes);
