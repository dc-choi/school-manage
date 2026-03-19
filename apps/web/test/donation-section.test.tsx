/**
 * 도네이션 섹션 테스트
 *
 * 환경변수 기반 노출/미노출, 후원 메시지 표시 검증
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// analytics 모킹
vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackDonationLinkClick: vi.fn(),
    },
}));

describe('DonationSection', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('카카오페이 URL 설정 시 후원 섹션이 렌더링된다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_KAKAOPAY_URL: 'https://qr.kakaopay.com/test',
            hasDonationLink: true,
        }));

        const { DonationSection } = await import('~/pages/settings/DonationSection');
        render(<DonationSection />);

        expect(screen.getByText('후원하기')).toBeInTheDocument();
        expect(screen.getByText(/봉사 프로젝트/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '카카오페이로 후원하기' })).toHaveAttribute(
            'href',
            'https://qr.kakaopay.com/test'
        );
        expect(screen.getByRole('link', { name: '카카오페이로 후원하기' })).toHaveAttribute(
            'target',
            '_blank'
        );
    });

    it('카카오페이 URL 미설정 시 후원 섹션이 렌더링되지 않는다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_KAKAOPAY_URL: '',
            hasDonationLink: false,
        }));

        const { DonationSection } = await import('~/pages/settings/DonationSection');
        const { container } = render(<DonationSection />);

        expect(container.innerHTML).toBe('');
    });
});
