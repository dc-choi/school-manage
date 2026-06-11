import { type Page, test as base, expect } from '@playwright/test';

/**
 * e2e 공용 픽스처
 *
 * 로그인은 worker당 1회만 UI로 수행하고, 이후 테스트는 sessionStorage 토큰을
 * 주입해 재사용한다. (인증 요청 횟수 절감 + 테스트 속도)
 */
export const E2E_ACCOUNT = {
    /** seed 계정: 장위동 중고등부 TEACHER, 동의 완료, 1학년 그룹에 학생 다수 */
    name: 'teacher1',
    password: '5678',
} as const;

/** /login 페이지에서 UI 로그인 후 대시보드 진입까지 대기 */
export const loginViaUi = async (page: Page): Promise<void> => {
    await page.goto('/login');
    await page.getByLabel('아이디').fill(E2E_ACCOUNT.name);
    await page.getByLabel('비밀번호').fill(E2E_ACCOUNT.password);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');
};

interface TestFixtures {
    /** 토큰이 주입된 인증 상태 페이지 */
    authedPage: Page;
}

interface WorkerFixtures {
    /** worker당 1회 UI 로그인으로 발급받은 액세스 토큰 */
    workerToken: string;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
    workerToken: [
        async ({ browser }, use) => {
            const context = await browser.newContext();
            const page = await context.newPage();
            await loginViaUi(page);
            const token = await page.evaluate(() => window.sessionStorage.getItem('token'));
            await context.close();

            if (!token) {
                throw new Error('로그인 후 sessionStorage에 token이 없습니다 — 인증 플로우 회귀 의심');
            }
            await use(token);
        },
        { scope: 'worker' },
    ],

    authedPage: async ({ page, workerToken }, use) => {
        await page.addInitScript((token) => {
            window.sessionStorage.setItem('token', token);
        }, workerToken);
        await use(page);
    },
});

export { expect };
