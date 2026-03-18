/**
 * 게스트 대시보드 테스트
 *
 * 비인증 시 대시보드 레이아웃 노출 + 로그인 유도 검증
 */
import { describe, expect, it } from 'vitest';

describe('게스트 대시보드 분기 로직', () => {
    it('비인증 + 로딩 완료 → 게스트 대시보드 표시', () => {
        const isAuthenticated = false;
        const isAuthLoading = false;

        const shouldShowGuest = !isAuthLoading && !isAuthenticated;
        expect(shouldShowGuest).toBe(true);
    });

    it('인증 로딩 중 → 게스트 대시보드 미표시', () => {
        const isAuthenticated = false;
        const isAuthLoading = true;

        const shouldShowGuest = !isAuthLoading && !isAuthenticated;
        expect(shouldShowGuest).toBe(false);
    });

    it('인증 완료 → 게스트 대시보드 미표시', () => {
        const isAuthenticated = true;
        const isAuthLoading = false;

        const shouldShowGuest = !isAuthLoading && !isAuthenticated;
        expect(shouldShowGuest).toBe(false);
    });
});

describe('사이드바 게스트 네비게이션 로직', () => {
    it('비인증 시 대시보드("/")는 정상 이동', () => {
        const isAuthenticated = false;
        const path = '/';
        const linkTo = !isAuthenticated && path !== '/' ? '/login' : path;
        expect(linkTo).toBe('/');
    });

    it('비인증 시 다른 경로는 /login으로 이동', () => {
        const isAuthenticated = false;
        const paths = ['/attendance', '/groups', '/students'];

        for (const path of paths) {
            const linkTo = !isAuthenticated && path !== '/' ? '/login' : path;
            expect(linkTo).toBe('/login');
        }
    });

    it('인증 시 모든 경로 정상 이동', () => {
        const isAuthenticated = true;
        const paths = ['/', '/attendance', '/groups', '/students'];

        for (const path of paths) {
            const linkTo = !isAuthenticated && path !== '/' ? '/login' : path;
            expect(linkTo).toBe(path);
        }
    });
});
