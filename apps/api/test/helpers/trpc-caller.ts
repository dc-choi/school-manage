/**
 * tRPC createCaller 테스트 유틸리티
 *
 * HTTP 오버헤드 없이 프로시저를 직접 호출하여 테스트할 수 있습니다.
 */
import { ROLE } from '@school/shared';
import type { Role } from '@school/shared';
import { createCallerFactory } from '@school/trpc';
import type { AuthContext, Context } from '@school/trpc';
import type { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { appRouter } from '~/app.router.js';

/**
 * AppRouter에 대한 caller 팩토리 생성
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Mock Request 객체 생성
 */
function createMockRequest(): Request {
    return {} as Request;
}

/**
 * Mock Response 객체 생성
 */
function createMockResponse(): Response {
    return {} as Response;
}

/**
 * 공개 프로시저용 caller 생성
 *
 * 인증이 필요하지 않은 프로시저 테스트에 사용
 *
 * @example
 * ```typescript
 * const caller = createPublicCaller();
 * const result = await caller.auth.login({ id: 'test', password: '1234' });
 * ```
 */
export function createPublicCaller() {
    const ctx: Context = {
        req: createMockRequest(),
        res: createMockResponse(),
    };
    return createCaller(ctx);
}

/**
 * 인증된 프로시저용 caller 생성
 *
 * protectedProcedure 테스트에 사용
 *
 * @param accountId - 계정 ID
 * @param accountName - 계정 이름
 *
 * @example
 * ```typescript
 * const caller = createAuthenticatedCaller('1', '중고등부');
 * const result = await caller.account.get();
 * ```
 */
export function createAuthenticatedCaller(accountId: string, accountName: string, displayName?: string) {
    const ctx: AuthContext = {
        req: createMockRequest(),
        res: createMockResponse(),
        account: { id: accountId, name: accountName, displayName: displayName ?? accountName },
        privacyAgreedAt: new Date(),
    };
    return createCaller(ctx);
}

/**
 * 조직 스코프 프로시저용 caller 생성
 *
 * scopedProcedure 테스트에 사용 (group, student, attendance, statistics)
 */
export function createScopedCaller(
    accountId: string,
    accountName: string,
    organizationId: string,
    organizationName: string,
    options?: { churchId?: string; churchName?: string; role?: Role; displayName?: string }
) {
    const ctx: Context = {
        req: createMockRequest(),
        res: createMockResponse(),
        account: {
            id: accountId,
            name: accountName,
            displayName: options?.displayName ?? accountName,
            organizationId,
            role: options?.role ?? ROLE.ADMIN,
        },
        privacyAgreedAt: new Date(),
        organization: {
            id: organizationId,
            name: organizationName,
            churchId: options?.churchId ?? '1',
            churchName: options?.churchName ?? '장위동성당',
        },
        church: {
            id: options?.churchId ?? '1',
            name: options?.churchName ?? '장위동성당',
            parishId: '1',
            parishName: '서울대교구',
        },
    };
    return createCaller(ctx);
}

/**
 * 커스텀 컨텍스트로 caller 생성
 *
 * 특수한 테스트 시나리오에 사용
 *
 * @param ctx - 커스텀 컨텍스트
 */
export function createCallerWithContext(ctx: Context) {
    return createCaller(ctx);
}

/**
 * JWT 토큰에서 계정 정보 추출
 *
 * 통합 테스트에서 로그인 후 계정 정보를 얻을 때 사용
 *
 * @param accessToken - JWT 액세스 토큰
 * @returns 계정 ID와 이름
 */
export function getAccountFromToken(accessToken: string): { id: string; name: string } {
    const decoded = jwt.decode(accessToken) as { id: string; name: string };
    return {
        id: decoded.id,
        name: decoded.name,
    };
}
