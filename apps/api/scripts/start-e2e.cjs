/**
 * e2e 전용 API 서버 부트스트랩
 *
 * Playwright webServer가 단일 명령으로 호출한다 (apps/web/playwright.config.ts):
 * 1) .env.test-e2e 로드 → school_e2e DATABASE_URL 구성
 * 2) prisma db push --force-reset + db seed (매 실행 깨끗한 데이터 보장)
 * 3) 빌드된 API 서버 기동 (dist/src/app.js, NODE_ENV=test-e2e)
 *
 * 서버가 포트를 여는 시점 = DB 준비 완료가 보장되므로
 * Playwright의 globalSetup/webServer 실행 순서에 의존하지 않는다.
 */
const { execSync, spawn } = require('node:child_process');
const path = require('node:path');

const apiDir = path.join(__dirname, '..');

require('dotenv').config({ path: path.join(apiDir, '.env.test-e2e') });

const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_SCHEMA } = process.env;

// 실DB 보호 가드: e2e 스키마가 아니면 즉시 중단 (force-reset이 전체 데이터를 지우므로)
if (!MYSQL_SCHEMA || !MYSQL_SCHEMA.includes('e2e')) {
    console.error(`[e2e] MYSQL_SCHEMA에 "e2e"가 포함되어야 합니다. 현재 값: ${MYSQL_SCHEMA ?? '(없음)'}`);
    console.error('[e2e] apps/api/.env.test-e2e 파일을 확인하세요 (.env.test-e2e.example 참조).');
    process.exit(1);
}

const databaseUrl = `mysql://${MYSQL_USERNAME}:${encodeURIComponent(MYSQL_PASSWORD ?? '')}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_SCHEMA}`;
const prismaEnv = {
    ...process.env,
    NODE_ENV: 'test-e2e',
    DATABASE_URL: databaseUrl,
    // vitest.global-setup.ts와 동일한 테스트 DB 리셋 승인 패턴 (e2e 전용 스키마 한정)
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'ㄱㄱ',
};

console.log(`[e2e] DB 초기화: ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_SCHEMA}`);
execSync('pnpm exec prisma db push --skip-generate --force-reset', { stdio: 'inherit', env: prismaEnv, cwd: apiDir });
execSync('pnpm exec prisma db seed', { stdio: 'inherit', env: prismaEnv, cwd: apiDir });

console.log('[e2e] API 서버 기동');
const server = spawn(process.execPath, ['dist/src/app.js'], {
    cwd: apiDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test-e2e' },
});

server.on('exit', (code, signal) => {
    // 시그널 종료(code=null)를 성공(0)으로 위장하지 않는다 — CI에서 서버 crash 은폐 방지
    if (signal) {
        console.error(`[e2e] 서버가 시그널로 종료됨: ${signal}`);
        process.exit(1);
    }
    process.exit(code ?? 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.kill(signal));
}
