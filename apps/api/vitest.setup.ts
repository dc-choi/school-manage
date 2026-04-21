/**
 * 통합 테스트 per-file setup (실제 DB 연결)
 *
 * 각 테스트 파일 실행 전 env 로딩 + 외부 서비스 mock + 로거 초기화.
 * DB 스키마는 globalSetup에서 1회 적용.
 */
import dotenv from 'dotenv';
import { join } from 'node:path';
import { beforeAll, vi } from 'vitest';

process.env.NODE_ENV = 'test';
dotenv.config({ path: join(process.cwd(), '.env.test') });

// mailService mock (실제 메일 발송 방지 — 모든 integration 테스트에 적용)
vi.mock('~/infrastructure/mail/mail.service.js', () => ({
    mailService: {
        isEnabled: vi.fn().mockReturnValue(true),
        sendSignupNotification: vi.fn().mockResolvedValue(undefined),
        sendChurnAlert: vi.fn().mockResolvedValue(undefined),
        sendOrgDailyReport: vi.fn().mockResolvedValue(undefined),
        sendTemporaryPassword: vi.fn().mockResolvedValue(true),
    },
}));

// logger는 database.ts 이후에 import해야 env가 설정된 상태에서 로드됨
const { logger } = await import('~/infrastructure/logger/logger.js');

beforeAll(async () => {
    logger.init({
        console: false,
        debug: false,
        log: false,
        error: true,
        fatal: true,
        sql: false,
        net: false,
    });
});
