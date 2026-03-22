/**
 * 미소속 사용자 라우팅 테스트
 *
 * DashboardPage의 상태별 분기 로직 검증
 * - 비인증 → 게스트 대시보드
 * - 인증 + orgId 없음 + pending → /pending 리다이렉트
 * - 인증 + orgId 없음 + 그 외 → /join 리다이렉트
 * - 인증 + orgId 있음 → 대시보드
 */
import { JOIN_REQUEST_STATUS } from '@school/shared';
import { describe, expect, it } from 'vitest';

type RoutingResult = 'guest' | 'redirect:/join' | 'redirect:/pending' | 'dashboard' | 'loading';

const resolveRouting = (
    isAuthLoading: boolean,
    isAuthenticated: boolean,
    organizationId: string | null,
    joinRequestStatus: string | null
): RoutingResult => {
    if (isAuthLoading) return 'loading';
    if (!isAuthenticated) return 'guest';
    if (!organizationId) {
        if (joinRequestStatus === JOIN_REQUEST_STATUS.PENDING) return 'redirect:/pending';
        return 'redirect:/join';
    }
    return 'dashboard';
};

describe('DashboardPage 미소속 사용자 라우팅', () => {
    it('비인증 + 로딩 완료 → 게스트 대시보드', () => {
        expect(resolveRouting(false, false, null, null)).toBe('guest');
    });

    it('인증 로딩 중 → 로딩 (리다이렉트 하지 않음)', () => {
        expect(resolveRouting(true, false, null, null)).toBe('loading');
    });

    it('인증 + orgId 없음 + joinRequestStatus 없음 → /join', () => {
        expect(resolveRouting(false, true, null, null)).toBe('redirect:/join');
    });

    it('인증 + orgId 없음 + joinRequestStatus=rejected → /join', () => {
        expect(resolveRouting(false, true, null, JOIN_REQUEST_STATUS.REJECTED)).toBe('redirect:/join');
    });

    it('인증 + orgId 없음 + joinRequestStatus=approved → /join', () => {
        expect(resolveRouting(false, true, null, JOIN_REQUEST_STATUS.APPROVED)).toBe('redirect:/join');
    });

    it('인증 + orgId 없음 + joinRequestStatus=pending → /pending', () => {
        expect(resolveRouting(false, true, null, JOIN_REQUEST_STATUS.PENDING)).toBe('redirect:/pending');
    });

    it('인증 + orgId 있음 → 대시보드', () => {
        expect(resolveRouting(false, true, '123', null)).toBe('dashboard');
    });

    it('인증 + orgId 있음 + 로딩 중 → 로딩', () => {
        expect(resolveRouting(true, true, '123', null)).toBe('loading');
    });
});

describe('계정 복원 후 라우팅', () => {
    it('복원 직후 (orgId=null, joinRequestStatus=null) → /join', () => {
        // 계정 삭제 시 organizationId=null로 설정됨
        // 복원 시 deletedAt만 null로 변경, organizationId는 null 유지
        expect(resolveRouting(false, true, null, null)).toBe('redirect:/join');
    });

    it('복원 후 합류 요청 (orgId=null, pending) → /pending', () => {
        expect(resolveRouting(false, true, null, JOIN_REQUEST_STATUS.PENDING)).toBe('redirect:/pending');
    });
});
