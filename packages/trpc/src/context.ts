import type { AccountInfo, ChurchInfo, OrganizationInfo } from '@school/shared';
import type { Request, Response } from 'express';

// 하위호환: 기존 consumer가 @school/trpc에서 import 가능
export type { AccountInfo, OrganizationInfo, ChurchInfo } from '@school/shared';

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
    organization?: OrganizationInfo;
    church?: ChurchInfo;
}

/**
 * 인증된 컨텍스트 (protectedProcedure에서 사용)
 */
export interface AuthContext extends BaseContext {
    account: AccountInfo;
    privacyAgreedAt?: Date | null;
    organization?: OrganizationInfo;
    church?: ChurchInfo;
}

/**
 * 조직 스코프 컨텍스트 (scopedProcedure에서 사용)
 *
 * organization, church가 반드시 존재
 */
export interface ScopedContext extends BaseContext {
    account: AccountInfo;
    privacyAgreedAt?: Date | null;
    organization: OrganizationInfo;
    church: ChurchInfo;
}
