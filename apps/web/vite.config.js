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
        sourcemap: true,
    },
});
