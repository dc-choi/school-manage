import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * 출석 화면 e2e 회귀 테스트 설정
 *
 * - API(9000) + Web vite dev(9080)를 webServer로 자동 기동/정리한다.
 * - API 기동 명령(start:e2e)이 school_e2e 스키마 리셋 + seed까지 수행하므로
 *   서버가 포트를 여는 순간 테스트 데이터가 준비되어 있다.
 * - 실행 전 apps/api/.env.test-e2e 필요 (.env.test-e2e.example 참조).
 * - dev 서버(9000/9080)가 떠 있으면 포트 충돌로 중단된다 — 실DB 오염 방지를 위한
 *   의도된 동작이므로 dev 서버를 내리고 실행한다.
 * - 실행: pnpm test:e2e (turbo가 @school/api#build를 선행)
 */
const WEB_PORT = 9080;
const API_PORT = 9000;
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    timeout: 30_000,

    use: {
        baseURL: `http://localhost:${WEB_PORT}`,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'desktop-chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            // 모바일 스모크: 실사용 모바일 비중이 높아 핵심 왕복(TC-2)만 모바일 뷰포트로 재검증
            name: 'mobile-chromium',
            use: { ...devices['Pixel 7'] },
            grep: /@mobile-smoke/,
        },
    ],

    webServer: [
        {
            command: 'pnpm --filter @school/api start:e2e',
            cwd: repoRoot,
            port: API_PORT,
            reuseExistingServer: false,
            timeout: 120_000,
            stdout: 'pipe',
            stderr: 'pipe',
        },
        {
            command: 'pnpm --filter @school/web dev',
            cwd: repoRoot,
            port: WEB_PORT,
            reuseExistingServer: false,
            timeout: 120_000,
        },
    ],
});
