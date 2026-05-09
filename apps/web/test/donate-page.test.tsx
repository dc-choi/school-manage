/**
 * DonatePage 테스트
 *
 * 공개 후원 페이지 렌더링, 계좌 정보 표시, 미설정 시 리다이렉트 검증
 */
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

    it('계좌 정보가 포함된 후원 페이지가 렌더링된다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_BANK: {
                bankName: '카카오뱅크',
                accountNumber: '3333372727008',
                accountHolder: '최동철(위클리랩)',
            },
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
        expect(screen.getByText('카카오뱅크')).toBeInTheDocument();
        expect(screen.getByText('3333372727008')).toBeInTheDocument();
        expect(screen.getByText('최동철(위클리랩)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /계좌번호 복사/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /돌아가기/ })).toBeInTheDocument();
    });

    it('후원 미설정 시 리다이렉트된다', async () => {
        vi.doMock('~/lib/donation', () => ({
            DONATION_BANK: { bankName: '', accountNumber: '', accountHolder: '' },
            hasDonationLink: false,
        }));

        const { DonatePage } = await import('~/pages/donate/DonatePage');
        const { container } = render(
            <MemoryRouter>
                <DonatePage />
            </MemoryRouter>
        );

        expect(container.querySelector('#donation')).toBeNull();
        expect(screen.queryByText('후원하기')).not.toBeInTheDocument();
    });
});
