import { Navigate, type RouteObject, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '~/features/auth';
import {
    AttendancePage,
    CalendarPage,
    DashboardPage,
    GroupAddPage,
    GroupDetailPage,
    GroupListPage,
    LandingPage,
    LoginPage,
    SignupPage,
    StudentAddPage,
    StudentDetailPage,
    StudentListPage,
} from '~/pages';

const routes: RouteObject[] = [
    // Public routes
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
    // Protected routes
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
];

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routes);
