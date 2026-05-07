/**
 * Footer 컴포넌트 테스트
 *
 * 사업자 정보·약관 링크·mailto·Copyright 노출 검증
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from '~/components/layout/Footer';
import { LEGAL_INFO } from '~/lib/legal-info';

const renderFooter = () =>
    render(
        <MemoryRouter>
            <Footer />
        </MemoryRouter>
    );

describe('Footer', () => {
    it('사업자 정보 4항목이 노출된다', () => {
        renderFooter();
        expect(screen.getByText(LEGAL_INFO.businessName)).toBeInTheDocument();
        expect(screen.getByText(/대표 최동철/)).toBeInTheDocument();
        expect(screen.getByText(/사업자등록번호 557-36-01673/)).toBeInTheDocument();
        expect(screen.getByText(LEGAL_INFO.contactEmail)).toBeInTheDocument();
    });

    it('이메일이 mailto 링크로 연결된다', () => {
        renderFooter();
        const emailLink = screen.getByRole('link', { name: LEGAL_INFO.contactEmail });
        expect(emailLink).toHaveAttribute('href', `mailto:${LEGAL_INFO.contactEmail}`);
    });

    it('약관 3종 링크가 정확한 경로로 노출된다', () => {
        renderFooter();
        expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
        expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy');
        expect(screen.getByRole('link', { name: '환불약관' })).toHaveAttribute('href', '/refund');
    });

    it('Copyright이 노출된다', () => {
        renderFooter();
        expect(screen.getByText(/© 2026 위클리랩/)).toBeInTheDocument();
    });

    it('시맨틱 footer 태그를 사용한다', () => {
        renderFooter();
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
});
