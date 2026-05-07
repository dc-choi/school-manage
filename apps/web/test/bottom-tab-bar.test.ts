/**
 * BottomTabBar 활성 탭 / 게스트 분기 / 더보기 활성 로직 검증
 * (mobile-ux-revamp)
 */
import { describe, expect, it } from 'vitest';
import { isActiveTab, isMoreActive, resolveTabNavigation } from '~/components/layout/BottomTabBar';

describe('isActiveTab', () => {
    it('홈 탭은 정확히 "/"에서만 활성', () => {
        expect(isActiveTab('/', 'home')).toBe(true);
        expect(isActiveTab('/attendance', 'home')).toBe(false);
        expect(isActiveTab('/groups', 'home')).toBe(false);
    });

    it('출석 탭은 /attendance 하위 경로에서 활성', () => {
        expect(isActiveTab('/attendance', 'attendance')).toBe(true);
        expect(isActiveTab('/attendance/table', 'attendance')).toBe(true);
        expect(isActiveTab('/students', 'attendance')).toBe(false);
    });

    it('학생 탭은 /students 하위에서 활성 (상세 포함)', () => {
        expect(isActiveTab('/students', 'students')).toBe(true);
        expect(isActiveTab('/students/123', 'students')).toBe(true);
        expect(isActiveTab('/students/new', 'students')).toBe(true);
        expect(isActiveTab('/groups', 'students')).toBe(false);
    });

    it('통계 탭은 /statistics 하위에서 활성', () => {
        expect(isActiveTab('/statistics', 'statistics')).toBe(true);
        expect(isActiveTab('/statistics?month=5', 'statistics')).toBe(true);
        expect(isActiveTab('/', 'statistics')).toBe(false);
    });

    it('더보기 탭은 isActiveTab의 5번째 인자로 판별 안 함 — false 고정', () => {
        expect(isActiveTab('/groups', 'more')).toBe(false);
        expect(isActiveTab('/settings', 'more')).toBe(false);
    });
});

describe('isMoreActive (4개 메인 탭에 매칭 안 되는 경로)', () => {
    it('메인 탭 매칭 경로는 더보기 비활성', () => {
        expect(isMoreActive('/')).toBe(false);
        expect(isMoreActive('/attendance')).toBe(false);
        expect(isMoreActive('/students')).toBe(false);
        expect(isMoreActive('/statistics')).toBe(false);
        expect(isMoreActive('/students/123')).toBe(false);
    });

    it('메인 탭 외 경로는 더보기 활성', () => {
        expect(isMoreActive('/groups')).toBe(true);
        expect(isMoreActive('/groups/42')).toBe(true);
        expect(isMoreActive('/settings')).toBe(true);
        expect(isMoreActive('/donate')).toBe(true);
        expect(isMoreActive('/anything-else')).toBe(true);
    });
});

describe('resolveTabNavigation (게스트 분기)', () => {
    it('인증 필요 + 게스트 → /login으로', () => {
        expect(resolveTabNavigation(true, false, '/attendance')).toBe('/login');
        expect(resolveTabNavigation(true, false, '/students')).toBe('/login');
        expect(resolveTabNavigation(true, false, '/statistics')).toBe('/login');
    });

    it('인증 필요 + 인증된 사용자 → 원래 경로', () => {
        expect(resolveTabNavigation(true, true, '/attendance')).toBe('/attendance');
        expect(resolveTabNavigation(true, true, '/students')).toBe('/students');
    });

    it('인증 불필요 → 게스트 여부 무관 원래 경로', () => {
        expect(resolveTabNavigation(false, false, '/')).toBe('/');
        expect(resolveTabNavigation(false, true, '/')).toBe('/');
    });
});
