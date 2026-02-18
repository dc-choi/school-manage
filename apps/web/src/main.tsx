import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '~/App';
import { GlobalErrorBoundary } from '~/components/common/GlobalErrorBoundary';
import { AuthProvider } from '~/features/auth';
import { queryClient } from '~/lib/queryClient';
import { trpc, trpcClient } from '~/lib/trpc';
import '~/styles/globals.css';

createRoot(document.getElementById('root')!).render(
    <GlobalErrorBoundary>
        <StrictMode>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </QueryClientProvider>
            </trpc.Provider>
        </StrictMode>
    </GlobalErrorBoundary>
);
