import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, defineProject } from 'vitest/config';

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, './src');

export default defineConfig({
    test: {
        // 프로젝트별 설정
        projects: [
            // 단위 테스트 (Prisma mocking 적용)
            defineProject({
                resolve: {
                    alias: { '~': srcPath },
                },
                test: {
                    name: 'unit',
                    environment: 'node',
                    sequence: { concurrent: false },
                    include: ['test/*.test.ts', 'test/caller/**/*.test.ts'],
                    setupFiles: ['./vitest.setup.ts'],
                    testTimeout: 10000,
                },
            }),
            // 통합 테스트 (Prisma mocking 사용)
            defineProject({
                resolve: {
                    alias: { '~': srcPath },
                },
                test: {
                    name: 'integration',
                    environment: 'node',
                    sequence: { concurrent: false },
                    include: ['test/integration/**/*.test.ts'],
                    setupFiles: ['./vitest.setup.ts'],
                    testTimeout: 30000,
                },
            }),
        ],
    },
});
