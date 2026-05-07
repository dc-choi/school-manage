/**
 * 약관 3페이지 + LegalPageLayout 테스트
 *
 * 페이지 제목·시행일·목차·Footer 동시 노출, 스크롤 초기화, 본문 핵심 요소 검증
 */
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PrivacyPage } from '~/pages/legal/PrivacyPage';
import { RefundPage } from '~/pages/legal/RefundPage';
import { TermsPage } from '~/pages/legal/TermsPage';

const renderRoute = (path: string, element: ReactNode) =>
    render(
        <HelmetProvider>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path={path} element={element} />
                </Routes>
            </MemoryRouter>
        </HelmetProvider>
    );

describe('TermsPage', () => {
    it('페이지 제목·시행일·목차·Footer가 함께 노출된다', () => {
        renderRoute('/terms', <TermsPage />);
        expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument();
        expect(screen.getByText(/시행일: 2026-05-06/)).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: '목차' })).toBeInTheDocument();
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('환불약관 본문 링크가 포함된다 (제8조)', () => {
        renderRoute('/terms', <TermsPage />);
        const refundLinks = screen.getAllByRole('link', { name: '환불약관' });
        expect(refundLinks.length).toBeGreaterThanOrEqual(1);
    });
});

describe('PrivacyPage', () => {
    it('개인정보처리방침 페이지가 렌더링된다', () => {
        renderRoute('/privacy', <PrivacyPage />);
        expect(screen.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: '목차' })).toBeInTheDocument();
    });

    it('개인정보 보호책임자 정보가 노출된다', () => {
        renderRoute('/privacy', <PrivacyPage />);
        expect(screen.getByText(/이름: 최동철/)).toBeInTheDocument();
    });
});

describe('RefundPage', () => {
    it('환불약관 페이지가 렌더링된다', () => {
        renderRoute('/refund', <RefundPage />);
        expect(screen.getByRole('heading', { level: 1, name: '환불약관' })).toBeInTheDocument();
    });

    it('처리 기한 안내(7영업일)가 노출된다', () => {
        renderRoute('/refund', <RefundPage />);
        expect(screen.getByText(/7영업일 이내/)).toBeInTheDocument();
    });
});

describe('LegalPageLayout 스크롤 초기화', () => {
    it('페이지 마운트 시 window.scrollTo(0, 0)이 호출된다', () => {
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        renderRoute('/terms', <TermsPage />);
        expect(scrollTo).toHaveBeenCalledWith(0, 0);
        scrollTo.mockRestore();
    });
});
