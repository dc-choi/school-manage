/**
 * 통합 테스트 공통 stub/mock
 *
 * DB 외 외부 의존성(Express, SMTP)의 스텁 및 mock 헬퍼
 */
import type { Request, Response } from 'express';
import type { Mock } from 'vitest';
import { vi } from 'vitest';
import { mailService } from '~/infrastructure/mail/mail.service.js';

// ================================================================
// Express Request/Response 스텁
// ================================================================

/**
 * 쿠키 동작을 추적하는 Express Response 스텁
 */
export const createMockRes = () => {
    return {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
    } as unknown as Response;
};

/**
 * 쿠키를 포함한 Express Request 스텁
 */
export const createMockReq = (cookies: Record<string, string> = {}): Request => {
    return { cookies } as unknown as Request;
};

// ================================================================
// mailService mock 타입 (vitest.integration-setup.ts에서 mock 적용)
// ================================================================

interface MockMailService {
    isEnabled: Mock;
    sendTemporaryPassword: Mock;
}

/**
 * mock된 mailService 참조 반환 (assertion용)
 */
export const getMockMailService = (): MockMailService => {
    return mailService as unknown as MockMailService;
};
