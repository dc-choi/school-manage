/**
 * 통합 테스트 글로벌 setup (전체 테스트 스위트에서 1회 실행)
 *
 * 테스트 DB 스키마를 초기화합니다.
 */
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { join } from 'node:path';

export default function setup() {
    dotenv.config({ path: join(process.cwd(), '.env.test') });

    const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_SCHEMA } = process.env;
    const encodedPassword = encodeURIComponent(MYSQL_PASSWORD ?? '');
    const mysqlUrl = `mysql://${MYSQL_USERNAME}:${encodedPassword}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_SCHEMA}`;

    execSync('pnpm exec prisma db push --skip-generate --force-reset', {
        stdio: 'pipe',
        env: {
            ...process.env,
            DATABASE_URL: mysqlUrl,
            PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'ㄱㄱ',
        },
        cwd: process.cwd(),
    });
}
