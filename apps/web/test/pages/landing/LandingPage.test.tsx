/**
 * LandingPage 11요소 표준 구조 개편 테스트
 *
 * docs/specs/functional-design/landing-page-restructure.md 테스트 시나리오 TC-1~TC-6, TC-E1~TC-E3
 */
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '~/pages/landing/LandingPage';

const navigateMock = vi.fn();
const trackLandingViewMock = vi.fn();
const trackLandingSectionViewMock = vi.fn();
const trackLandingCtaClickMock = vi.fn();
const trackLandingLoginClickMock = vi.fn();
const trackLandingFaqClickMock = vi.fn();

interface CountData {
    churchCount: number;
    accountCount: number;
    studentCount: number;
}

interface CountQueryResult {
    data: CountData | undefined;
    isLoading: boolean;
    error: Error | null;
}

const useAuthMock = vi.fn<() => { isAuthenticated: boolean; isLoading: boolean }>(() => ({
    isAuthenticated: false,
    isLoading: false,
}));
const useCountQueryMock = vi.fn<() => CountQueryResult>(() => ({
    data: { churchCount: 79, accountCount: 288, studentCount: 3314 },
    isLoading: false,
    error: null,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock('~/features/auth', () => ({
    useAuth: () => useAuthMock(),
}));

vi.mock('~/lib/trpc', () => ({
    trpc: {
        account: {
            count: {
                useQuery: () => useCountQueryMock(),
            },
        },
        liturgical: {
            season: {
                useQuery: () => ({ data: undefined, isLoading: false, error: null }),
            },
        },
    },
}));

vi.mock('~/lib/analytics', () => ({
    analytics: {
        trackLandingView: (...args: unknown[]) => trackLandingViewMock(...args),
        trackLandingSectionView: (...args: unknown[]) => trackLandingSectionViewMock(...args),
        trackLandingCtaClick: (...args: unknown[]) => trackLandingCtaClickMock(...args),
        trackLandingLoginClick: (...args: unknown[]) => trackLandingLoginClickMock(...args),
        trackLandingFaqClick: (...args: unknown[]) => trackLandingFaqClickMock(...args),
    },
}));

vi.mock('../../../src/pages/landing/InteractiveDemo', () => ({
    InteractiveDemo: () => <div data-testid="interactive-demo" />,
}));

const renderLanding = () =>
    render(
        <HelmetProvider>
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        </HelmetProvider>
    );

beforeAll(() => {
    if (!('IntersectionObserver' in globalThis)) {
        class MockIntersectionObserver {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
            takeRecords = vi.fn(() => []);
        }
        (globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
            MockIntersectionObserver;
    }
    Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, isLoading: false });
    useCountQueryMock.mockReturnValue({
        data: { churchCount: 79, accountCount: 288, studentCount: 3314 },
        isLoading: false,
        error: null,
    });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('LandingPage — 11요소 표준 구조', () => {
    it('TC-1: 비인증 진입 시 Nav 헤더 + Hero CTA 버튼 + landing_view 발화', () => {
        renderLanding();

        expect(screen.getByRole('banner')).toBeInTheDocument();
        const startButtons = screen.getAllByRole('button', { name: '시작하기' });
        expect(startButtons.length).toBeGreaterThanOrEqual(2);
        expect(trackLandingViewMock).toHaveBeenCalledTimes(1);
        expect(trackLandingSectionViewMock).toHaveBeenCalledWith('hero');
    });

    it('TC-2: Nav 시작하기 클릭 → trackLandingCtaClick(top) + /signup 이동', () => {
        renderLanding();

        const navStartButton = screen.getAllByRole('button', { name: '시작하기' })[0];
        fireEvent.click(navStartButton!);

        expect(trackLandingCtaClickMock).toHaveBeenCalledWith('top');
        expect(navigateMock).toHaveBeenCalledWith('/signup');
    });

    it('TC-3: Hero 시작하기 클릭 → trackLandingCtaClick(hero) + /signup 이동', () => {
        renderLanding();

        const startButtons = screen.getAllByRole('button', { name: '시작하기' });
        const heroStartButton = startButtons[startButtons.length - 1];
        fireEvent.click(heroStartButton!);

        expect(trackLandingCtaClickMock).toHaveBeenCalledWith('hero');
        expect(navigateMock).toHaveBeenCalledWith('/signup');
    });

    it('TC-4: countData 정상 도착 시 Social Proof에 통계 줄 노출', () => {
        renderLanding();

        expect(screen.getByText(/79개 본당에서 288명의 선생님들이/)).toBeInTheDocument();
        expect(screen.getByText('이런 가톨릭 모임에서 사용 중')).toBeInTheDocument();
    });

    it('TC-5: Footer 인스타 링크는 새 탭으로 안전하게 열린다', () => {
        renderLanding();

        const instaLink = screen.getByRole('link', { name: '인스타그램' });
        expect(instaLink).toHaveAttribute('target', '_blank');
        expect(instaLink).toHaveAttribute('rel', 'noopener noreferrer');
        expect(instaLink.getAttribute('href')).toContain('instagram.com');
    });

    it('TC-6: 인증 상태에서는 / 로 리다이렉트한다', () => {
        useAuthMock.mockReturnValueOnce({ isAuthenticated: true, isLoading: false });
        renderLanding();

        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
        expect(screen.queryByText('매주 일요일,')).not.toBeInTheDocument();
    });

    it('TC-E1: countData 실패 시 통계 줄 숨김 + 5카드는 표시', () => {
        useCountQueryMock.mockReturnValueOnce({
            data: undefined,
            isLoading: false,
            error: new Error('boom'),
        });
        renderLanding();

        expect(screen.queryByText(/개 본당에서/)).not.toBeInTheDocument();
        expect(screen.getByText('이런 가톨릭 모임에서 사용 중')).toBeInTheDocument();
        expect(screen.getByText('주일학교')).toBeInTheDocument();
    });

    it('Why Choose Us 섹션이 렌더되고 카드 4개가 노출된다', () => {
        renderLanding();

        expect(screen.getByRole('heading', { name: '왜 이 도구를 쓸까요?' })).toBeInTheDocument();
        expect(screen.getByText('주간 도구로 설계')).toBeInTheDocument();
        expect(screen.getByText('가톨릭에 특화')).toBeInTheDocument();
        expect(screen.getByText('종이와 엑셀 대신')).toBeInTheDocument();
        expect(screen.getByText('모바일에서 즉시')).toBeInTheDocument();
    });

    it('Reviews 섹션 사용 사례 카드 4개가 렌더된다', () => {
        renderLanding();

        expect(screen.getByText('이런 본당이 이렇게 씁니다')).toBeInTheDocument();
        expect(screen.getByText('주일학교 운영')).toBeInTheDocument();
        expect(screen.getByText('다중 교사 협업')).toBeInTheDocument();
        expect(screen.getByText('통계 자동 정리')).toBeInTheDocument();
        expect(screen.getByText('모바일 즉시 사용')).toBeInTheDocument();
    });

    it('Hero "데모 체험" 링크가 #demo 앵커를 가리킨다', () => {
        renderLanding();

        const demoLink = screen.getByRole('link', { name: '데모 체험' });
        expect(demoLink).toHaveAttribute('href', '#demo');
    });

    it('마무리 CTA 버튼 클릭 시 trackLandingCtaClick(bottom) + /signup', () => {
        renderLanding();

        const bottomCta = screen.getByRole('button', { name: '지금 시작해보기' });
        fireEvent.click(bottomCta);

        expect(trackLandingCtaClickMock).toHaveBeenCalledWith('bottom');
        expect(navigateMock).toHaveBeenCalledWith('/signup');
    });
});
