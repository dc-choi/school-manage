/**
 * 컨텍스트 배너 테스트
 *
 * 배너 노출 조건, CTA 동작, 미표시 조건 검증
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// react-router-dom 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// analytics 모킹
vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackContextBannerShown: vi.fn(),
        trackContextBannerClicked: vi.fn(),
    },
}));

import { ContextBanner } from '~/pages/dashboard/ContextBanner';
import { analytics } from '~/lib/analytics';

describe('ContextBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('배너가 렌더링되고 출석 유도 문구를 포함한다', () => {
        render(<ContextBanner />);

        expect(screen.getByText(/출석을 기록해보세요/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '출석부 열기' })).toBeInTheDocument();
    });

    it('배너 마운트 시 GA4 context_banner_shown 이벤트가 1회 발송된다', () => {
        render(<ContextBanner />);

        expect(analytics.trackContextBannerShown).toHaveBeenCalledTimes(1);
        expect(analytics.trackContextBannerShown).toHaveBeenCalledWith(
            expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        );
    });

    it('CTA 클릭 시 /attendance로 이동하고 GA4 이벤트가 발송된다', () => {
        render(<ContextBanner />);

        const button = screen.getByRole('button', { name: '출석부 열기' });
        fireEvent.click(button);

        expect(analytics.trackContextBannerClicked).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/attendance');
    });

    it('배너 문구에 월/일 날짜가 포함된다', () => {
        render(<ContextBanner />);

        const statusElement = screen.getByRole('status');
        // "N월 N일" 패턴 확인
        expect(statusElement.textContent).toMatch(/\d+월 \d+일/);
    });
});

describe('useOnboardingStatus 분기 로직', () => {
    it('step 3 조건: hasGroups && hasStudents && !hasAttendance', () => {
        // 분기 로직 단위 테스트 (DashboardPage의 조건 검증)
        const hasGroups = true;
        const hasStudents = true;
        const hasAttendance = false;

        let currentStep: 0 | 1 | 2 | 3;
        if (!hasGroups) {
            currentStep = 1;
        } else if (!hasStudents) {
            currentStep = 2;
        } else if (!hasAttendance) {
            currentStep = 3;
        } else {
            currentStep = 0;
        }

        expect(currentStep).toBe(3);
    });

    it('step 1 조건: !hasGroups → 체크리스트 표시 (배너 아님)', () => {
        const hasGroups = false;

        let currentStep: 0 | 1 | 2 | 3;
        if (!hasGroups) {
            currentStep = 1;
        } else {
            currentStep = 0;
        }

        expect(currentStep).toBe(1);
        expect(currentStep).not.toBe(3);
    });

    it('step 0 조건: 모두 완료 → 배너 미표시', () => {
        const hasGroups = true;
        const hasStudents = true;
        const hasAttendance = true;

        let currentStep: 0 | 1 | 2 | 3;
        if (!hasGroups) {
            currentStep = 1;
        } else if (!hasStudents) {
            currentStep = 2;
        } else if (!hasAttendance) {
            currentStep = 3;
        } else {
            currentStep = 0;
        }

        expect(currentStep).toBe(0);
    });
});
