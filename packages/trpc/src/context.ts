import type { AccountInfo } from './shared';
import { Request, Response } from 'express';

// AccountInfo 재export (호환성 유지)
export type { AccountInfo } from './shared';

/**
 * 기본 컨텍스트 (모든 요청)
 *
 * 참고: 서버에서만 req/res를 구체 타입으로 좁혀 사용한다.
 */
export interface BaseContext {
    req: Request;
    res: Response;
}

/**
 * tRPC 컨텍스트 (인증 정보 포함 가능)
 */
export interface Context extends BaseContext {
    account?: AccountInfo;
    privacyAgreedAt?: Date | null;
}

/**
 * 인증된 컨텍스트 (protectedProcedure에서 사용)
 */
export interface AuthContext extends BaseContext {
    account: AccountInfo;
    privacyAgreedAt?: Date | null;
}
