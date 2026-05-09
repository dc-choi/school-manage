/**
 * Sidebar 라벨 분기 테스트 — ORGANIZATION_TYPE에 따라 학년&부서/학생 vs 그룹&부서/멤버 노출
 *
 * 배경: docs/specs/functional-design/young-adult-wording.md
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '~/components/layout/Sidebar';

const mockUseAuth = vi.fn();

vi.mock('~/features/auth', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('~/lib/donation', () => ({
    hasDonationLink: false,
}));

const renderSidebar = () =>
    render(
        <MemoryRouter>
            <Sidebar />
        </MemoryRouter>
    );

afterEach(() => {
    mockUseAuth.mockReset();
});

describe('Sidebar 라벨 분기', () => {
    it('ELEMENTARY 모임은 "학년&부서" / "학생 관리" 노출', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, organizationType: 'ELEMENTARY' });
        renderSidebar();

        expect(screen.getByLabelText('학년&부서')).toBeInTheDocument();
        expect(screen.getByLabelText('학생 관리')).toBeInTheDocument();
    });

    it('MIDDLE_HIGH 모임도 "학년&부서" / "학생 관리" 노출', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, organizationType: 'MIDDLE_HIGH' });
        renderSidebar();

        expect(screen.getByLabelText('학년&부서')).toBeInTheDocument();
        expect(screen.getByLabelText('학생 관리')).toBeInTheDocument();
    });

    it('YOUNG_ADULT 모임은 "그룹&부서" / "멤버 관리" 노출', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, organizationType: 'YOUNG_ADULT' });
        renderSidebar();

        expect(screen.getByLabelText('그룹&부서')).toBeInTheDocument();
        expect(screen.getByLabelText('멤버 관리')).toBeInTheDocument();
    });

    it('organizationType이 null이면 기본 라벨로 fallback (회귀 0)', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, organizationType: null });
        renderSidebar();

        expect(screen.getByLabelText('학년&부서')).toBeInTheDocument();
        expect(screen.getByLabelText('학생 관리')).toBeInTheDocument();
    });
});
