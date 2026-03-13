/**
 * @school/shared/auth - 도메인 인증 상태 타입
 *
 * Express/tRPC에 의존하지 않는 순수 도메인 인증 상태 정의
 */

import type { AccountInfo, ChurchInfo, OrganizationInfo } from './constants.js';

/**
 * 도메인 인증 상태
 *
 * 서버 프레임워크(Express, tRPC)와 무관한 인증 정보
 */
export interface AuthState {
    account: AccountInfo;
    privacyAgreedAt?: Date | null;
    organization?: OrganizationInfo;
    church?: ChurchInfo;
}
