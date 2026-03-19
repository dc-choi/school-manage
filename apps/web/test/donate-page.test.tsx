/**
 * DonatePage 테스트
 *
 * 공개 후원 페이지 렌더링, URL 미설정 시 리다이렉트 검증
 */
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// analytics 모킹
vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackDonatePageViewed: vi.fn(),
        trackDonationLinkClick: vi.fn(),
    },
}));

describe('DonatePage', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('카카오페이 URL 설정 시 후원 페이지가 렌더링된다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_KAKAOPAY_URL: 'https://qr.kakaopay.com/test',
            hasDonationLink: true,
        }));

        const { DonatePage } = await import('~/pages/donate/DonatePage');
        render(
            <HelmetProvider>
                <MemoryRouter>
                    <DonatePage />
                </MemoryRouter>
            </HelmetProvider>
        );

        expect(screen.getByText('주일학교 출석부')).toBeInTheDocument();
        expect(screen.getByText('후원하기')).toBeInTheDocument();
        expect(screen.getByText(/봉사 프로젝트/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '카카오페이로 후원하기' })).toHaveAttribute(
            'href',
            'https://qr.kakaopay.com/test'
        );
        expect(screen.getByRole('link', { name: '카카오페이로 후원하기' })).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('link', { name: '카카오페이로 후원하기' })).toHaveAttribute(
            'rel',
            'noopener noreferrer'
        );
        expect(screen.getByRole('button', { name: /돌아가기/ })).toBeInTheDocument();
    });

    it('카카오페이 URL 미설정 시 리다이렉트된다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_KAKAOPAY_URL: '',
            hasDonationLink: false,
        }));

        const { DonatePage } = await import('~/pages/donate/DonatePage');
        const { container } = render(
            <MemoryRouter>
                <DonatePage />
            </MemoryRouter>
        );

        // Navigate 컴포넌트가 렌더링되므로 후원 콘텐츠 없음
        expect(container.querySelector('#donation')).toBeNull();
        expect(screen.queryByText('후원하기')).not.toBeInTheDocument();
    });
});
