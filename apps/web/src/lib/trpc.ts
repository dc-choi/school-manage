// AppRouter 타입은 @school/api 패키지에서 가져옴
import type { AppRouter } from '@school/api/app.router';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

// tRPC React Query 클라이언트
export const trpc = createTRPCReact<AppRouter>();

// tRPC 클라이언트 인스턴스
export const trpcClient = trpc.createClient({
    transformer: superjson,
    links: [
        httpBatchLink({
            url: '/trpc',
            headers() {
                const token = sessionStorage.getItem('token');
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
        }),
    ],
});
