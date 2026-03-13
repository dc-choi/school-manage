// AppRouter 타입은 @school/api 패키지에서 가져옴
import type { AppRouter } from '@school/api/app.router';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

// tRPC React Query 클라이언트
export const trpc = createTRPCReact<AppRouter>();

// silent refresh 중복 방지 (동시 요청 직렬화)
let refreshPromise: Promise<string | null> | null = null;

const silentRefresh = async (): Promise<string | null> => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await fetch('/trpc/auth.refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({}),
            });
            if (!res.ok) return null;
            const json = await res.json();
            const accessToken = json?.result?.data?.json?.accessToken;
            if (accessToken) {
                sessionStorage.setItem('token', accessToken);
                return accessToken;
            }
            return null;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

const fetchWithRefresh: typeof fetch = async (url, options) => {
    const response = await fetch(url, { ...options, credentials: 'include' });

    if (response.status !== 401) return response;

    // refresh 엔드포인트 자체의 401은 재시도하지 않음
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('auth.refresh')) return response;

    // silent refresh 시도
    const newToken = await silentRefresh();
    if (!newToken) return response;

    // 새 토큰으로 원래 요청 재시도
    const newHeaders = new Headers(options?.headers);
    newHeaders.set('Authorization', `Bearer ${newToken}`);
    return fetch(url, { ...options, credentials: 'include', headers: newHeaders });
};

// tRPC 클라이언트 인스턴스
export const trpcClient = trpc.createClient({
    transformer: superjson,
    links: [
        httpBatchLink({
            url: '/trpc',
            fetch: fetchWithRefresh,
            headers() {
                const token = sessionStorage.getItem('token');
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
        }),
    ],
});
