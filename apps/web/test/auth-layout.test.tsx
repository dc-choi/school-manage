/**
 * AuthLayout 테스트
 *
 * 히어로 이미지 CLS 방지: width/height/decoding 속성 명시 검증
 * (배경: docs/specs/functional-design/auth-layout-cls.md)
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/lib/trpc', () => ({
    trpc: {
        account: {
            count: {
                useQuery: vi.fn(() => ({
                    data: undefined,
                    isLoading: false,
                    error: null,
                })),
            },
        },
    },
}));

import { AuthLayout } from '~/components/layout/AuthLayout';

describe('AuthLayout 히어로 이미지', () => {
    it('width/height 속성이 명시되어 있다 (CLS 방지)', () => {
        render(
            <AuthLayout>
                <div>child</div>
            </AuthLayout>
        );

        const img = screen.getByAltText('출석부 대시보드 화면') as HTMLImageElement;
        expect(img.getAttribute('width')).toBe('1440');
        expect(img.getAttribute('height')).toBe('900');
    });

    it('decoding="async" 속성이 명시되어 있다 (메인 스레드 차단 최소화)', () => {
        render(
            <AuthLayout>
                <div>child</div>
            </AuthLayout>
        );

        const img = screen.getByAltText('출석부 대시보드 화면') as HTMLImageElement;
        expect(img.getAttribute('decoding')).toBe('async');
    });

    it('대시보드 스크린샷 경로를 src로 사용한다', () => {
        render(
            <AuthLayout>
                <div>child</div>
            </AuthLayout>
        );

        const img = screen.getByAltText('출석부 대시보드 화면') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe('/images/screenshot-dashboard.png');
    });

    it('loading 속성을 설정하지 않는다 (above-the-fold 히어로)', () => {
        render(
            <AuthLayout>
                <div>child</div>
            </AuthLayout>
        );

        const img = screen.getByAltText('출석부 대시보드 화면') as HTMLImageElement;
        expect(img.getAttribute('loading')).toBeNull();
    });
});
