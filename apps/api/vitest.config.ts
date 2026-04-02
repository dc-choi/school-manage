import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(__dirname, './src');

export default defineConfig({
    resolve: {
        alias: { '~': srcPath },
    },
    test: {
        environment: 'node',
        fileParallelism: false,
        sequence: { concurrent: false },
        include: ['test/**/*.test.ts'],
        globalSetup: ['./vitest.global-setup.ts'],
        setupFiles: ['./vitest.setup.ts'],
        testTimeout: 30000,
    },
});
