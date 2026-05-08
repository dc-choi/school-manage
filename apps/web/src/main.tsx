import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from '~/App';
import { GlobalErrorBoundary } from '~/components/common/GlobalErrorBoundary';
import { AuthProvider } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { type BeforeInstallPromptEvent, detectPwaEnv, setInstallPrompt } from '~/lib/pwa';
import { queryClient } from '~/lib/queryClient';
import { trpc, trpcClient } from '~/lib/trpc';
import '~/styles/globals.css';

// PWA: install-eligibility 충족용 minimal Service Worker 등록.
// 등록 실패는 운영 모니터링이 필요한 시그널이므로 console.error로 severity 격상.
const registerServiceWorker = (): void => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
        console.error('[PWA] Service Worker 등록 실패', error);
    });
};

// PWA: beforeinstallprompt 이벤트는 페이지 로드 시점에 한 번 발화 → ref 보관.
// 모듈 스코프 named handler — HMR 재실행 시 중복 등록 회피용 (cleanup은 SPA 종료 시점).
const handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    setInstallPrompt(event as BeforeInstallPromptEvent);
};

// PWA: 홈 화면 추가 완료 시 GA4 발화.
const handleAppInstalled = (): void => {
    const env = detectPwaEnv(navigator.userAgent, window.innerWidth);
    analytics.trackPwaA2hsInstalled(env);
    setInstallPrompt(null);
};

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', registerServiceWorker, { once: true });
}

window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
window.addEventListener('appinstalled', handleAppInstalled);

createRoot(document.getElementById('root')!).render(
    <GlobalErrorBoundary>
        <StrictMode>
            <HelmetProvider>
                <trpc.Provider client={trpcClient} queryClient={queryClient}>
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>
                            <App />
                            <Toaster position="top-center" richColors closeButton duration={3000} />
                        </AuthProvider>
                    </QueryClientProvider>
                </trpc.Provider>
            </HelmetProvider>
        </StrictMode>
    </GlobalErrorBoundary>
);
