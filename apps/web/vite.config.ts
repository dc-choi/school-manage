import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],

    resolve: {
        alias: {
            '~': resolve(__dirname, './src'),
        },
    },

    server: {
        port: 9080,
        proxy: {
            '/trpc': {
                target: 'http://localhost:9000',
                changeOrigin: true,
            },
        },
    },

    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (
                        id.includes('/react-dom/') ||
                        id.includes('/react-router') ||
                        id.includes('/scheduler/') ||
                        (id.includes('/react/') && !id.includes('react-query'))
                    ) {
                        return 'vendor-react';
                    }
                    if (
                        id.includes('@radix-ui') ||
                        id.includes('radix-ui') ||
                        id.includes('lucide-react') ||
                        id.includes('tailwind-merge') ||
                        id.includes('class-variance-authority') ||
                        id.includes('clsx')
                    ) {
                        return 'vendor-ui';
                    }
                    if (id.includes('@tanstack') || id.includes('@trpc') || id.includes('superjson')) {
                        return 'vendor-query';
                    }
                },
            },
        },
    },
});
