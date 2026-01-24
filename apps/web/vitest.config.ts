import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    // @ts-ignore
    plugins: [react()],

    test: {
        // 환경: jsdom (브라우저 시뮬레이션)
        environment: 'jsdom',

        // setup 파일
        setupFiles: ['./vitest.setup.ts'],

        // 테스트 파일 패턴
        include: ['test/**/*.test.{ts,tsx}'],

        // globals (describe, it, expect 전역 사용)
        globals: true,
    },

    // 경로 별칭
    resolve: {
        alias: {
            '~': resolve(__dirname, './src'),
        },
    },
});
